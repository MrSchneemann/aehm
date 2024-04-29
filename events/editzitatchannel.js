const { Events, Partials } = require('discord.js');
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

module.exports = {
    name: Events.MessageUpdate,
    on: true,
    async execute(oldMessage, newMessage) {
        // Connect to the MongoDB cluster
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();

        try {
            // Access the database and collection
            const database = client.db(process.env.MONGODB_DBNAME);
            const guildSpecificCollection = newMessage.guild.id;
            const serverCollection = database.collection(guildSpecificCollection + "_server");

            // Retrieve the server configuration
            const serverConfig = await serverCollection.findOne({ _id: "config" });

            // Check if the message edit should be handled only in a specific channel
            const channelId = serverConfig.channel_zitat_id;
            if (newMessage.channel.id !== channelId) return;

            const quotesCollection = database.collection(guildSpecificCollection + "_zitate");

            // Check if the edited message exists in the database and if it's a quote
            const existingQuote = await quotesCollection.findOne({ message_id: newMessage.id });
            if (existingQuote) {
                // If the edited message exists in the database and it's a quote, update it
                const content = newMessage.content.trim();
                const match = content.match(/^(.+?)\s*[-~]\s*(.+?)$/);
                if (!match) return;

                const zitat_text = match[1].trim();
                const author_name = match[2].trim();

                // Update the quote in the database
                await quotesCollection.updateOne({ message_id: newMessage.id }, { $set: { zitat_text, author_name } });

                console.log(`Quote associated with message ID ${newMessage.id} was updated in the database.`);

                // remove the old reaction
                await newMessage.reactions.removeAll();
                await newMessage.react("✏️");
                await newMessage.reactions.removeAll();
                await newMessage.react("👍");
            }
        } catch (error) {
            console.error('Error while processing message edit:', error);
        } finally {
            // Close the connection when done
            await client.close();
        }
    },
};

// Path: events/editzitatchannel.js
