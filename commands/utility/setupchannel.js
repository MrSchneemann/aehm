const { SlashCommandBuilder } = require('discord.js');
const { MongoClient } = require('mongodb');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupchannel')
        .setDescription('Set the channel where quotes will be retrieved from')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to retrieve quotes from')
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

            // Access the database
            const database = client.db(process.env.MONGODB_DBNAME);

            // Get the channel ID from the interaction options
            const channelId = interaction.options.getChannel('channel').id;

            // Update the channel_zitat_id in the server config
            const serverCollection = database.collection(`${interaction.guildId}_server`);
            await serverCollection.updateOne({ _id: "config" }, { $set: { channel_zitat_id: channelId } }, { upsert: true });

            await interaction.reply('Channel for quotes setup completed. You can now use the /import command to import existing Zitate.');

        } catch (error) {
            console.error('Error setting up channel:', error);
            await interaction.reply('An error occurred while setting up the channel for quotes.');
        } finally {
            // Close the connection when done
            await client.close();
        }
    },
};

// Path: commands/utility/setupchannel.js
