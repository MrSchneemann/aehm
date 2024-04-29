const { SlashCommandBuilder } = require('discord.js');
const { MongoClient } = require('mongodb');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup collections for the server in the database'),

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

            // Get the guild ID of the server where the command is executed
            const guildId = interaction.guildId;

            // Check if collections exist for the current guild
            const collectionsExist = await database.listCollections({ name: `${guildId}_zitate` }).hasNext();

            if (!collectionsExist) {
                // Create collections for quotes and server data for the current guild
                await database.createCollection(`${guildId}_zitate`);
                await database.createCollection(`${guildId}_server`);

                // Insert initial server config data
                await database.collection(`${guildId}_server`).insertOne({
                    _id: "config",
                    channel_zitat_id: null // Placeholder value, prompt user to set this
                });

                await interaction.reply('Collections setup completed. Please run the /setupchannel command to set the channel for quotes.');
            } else {
                await interaction.reply('Collections already exist for this server. Run the /setupchannel command to set the channel for quotes.');
            }

        } catch (error) {
            console.error('Error setting up collections:', error);
            await interaction.reply('An error occurred while setting up collections.');
        } finally {
            // Close the connection when done
            await client.close();
        }
    },
};

// Path: commands/utility/setup.js
