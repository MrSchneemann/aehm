const { SlashCommandBuilder } = require('discord.js');
const { MongoClient } = require('mongodb');

let quotesAdded = 0;

// Define a function to fetch messages with pagination
async function fetchAllMessages(channel, startMessage) {
    // Send a message indicating import started
    const importMessage = await startMessage.reply({ content: 'Import started...', ephemeral: true });

    const result = [];
    let lastMessageId = null;

    while (true) {
        // Fetch a pack of messages
        const messages = await channel.messages.fetch({ limit: 100, before: lastMessageId });

        // If there are no more messages to fetch, break out of the loop
        if (messages.size === 0) break;

        // Update the last message ID for the next fetch
        lastMessageId = messages.lastKey();

        // Add the messages to the result
        result.push(...messages.values());
    }

    return result;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('import')
        .setDescription('Import quotes from a specified channel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to import quotes from')
                .setRequired(true)),
    async execute(interaction) {
        // Check if the user invoking the command is authorized
        const allowedUserId = process.env.ALLOWED_USER_ID;
        const userId = interaction.user.id;

        if (userId !== allowedUserId) {
            return await interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
        }

        // MongoDB connection URI
        const uri = process.env.MONGODB_URI;

        // Create a new MongoClient
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

        try {
            // Connect to the MongoDB cluster
            await client.connect();

            // Access the database and collections
            const database = client.db(process.env.MONGODB_DBNAME);
            const guildSpecificCollection = interaction.guild.id;
            const quotesCollection = database.collection(guildSpecificCollection + "_zitate");

            // Get the specified channel ID from the interaction options
            const channelId = interaction.options.getChannel('channel').id;

            // Fetch the channel using the ID
            const channel = interaction.guild.channels.cache.get(channelId);

            if (!channel) {
                return await interaction.reply('Invalid channel.');
            }

            // Fetch all messages from the specified channel
            const messages = await fetchAllMessages(channel, interaction);

            // Iterate through fetched messages
            for (const message of messages) {
                // Check if the message is a quote (you might need to adjust this check based on your message format)
                const match = message.content.match(/^(.+?)\s*[-~]\s*(.+?)$/);
                if (!match) continue;

                // Extract quote details
                const zitat_text = match[1].trim();
                const author_name = match[2].trim();
                const submitted_by_id = message.author.id;

                // Check if the quote already exists in the database
                const existingQuote = await quotesCollection.findOne({ message_id: message.id });
                if (!existingQuote) {
                    // If the quote doesn't exist, insert it into the database
                    await quotesCollection.insertOne({ zitat_text, author_name, submitted_by_id, message_id: message.id });
                    console.log(`Quote associated with message ID ${message.id} was imported into the database.`);
                    quotesAdded++;
                }
            }

        } catch (error) {
            console.error(error);

            // Check if the error is due to an unknown interaction
            if (error.code === 10062) {
                console.log('Interaction no longer exists.');
            } else {
                await interaction.reply('There was an error while importing quotes.');
            }
        } finally {
            // Close the connection when done
            await client.close();
            await interaction.editReply({ content: 'Import completed, ' + quotesAdded + ' added!', ephemeral: true });
        }
    },
};

// Path: commands/utility/import.js
