const { Events, Partials } = require('discord.js');
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

module.exports = {
    name: Events.MessageDelete,
    on: true,
    async execute(message) {
        // Connect to the MongoDB cluster
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();

        try {
            const database = client.db(process.env.MONGODB_DBNAME);
            const guildSpecificCollection = message.guild.id;
            const serverCollection = database.collection(guildSpecificCollection + "_server");
            const serverConfig = await serverCollection.findOne({ _id: "config" });
            const channelId = serverConfig.channel_zitat_id;

            if (message.channel.id !== channelId) return;

            const quotesCollection = database.collection(guildSpecificCollection + "_zitate");

            // Check if the deleted message exists in the database
            const existingQuote = await quotesCollection.findOne({ message_id: message.id });
            if (existingQuote) {
                // If the deleted message exists in the database, delete it from the collection
                await quotesCollection.deleteOne({ message_id: message.id });
                console.log(`Quote associated with message ID ${message.id} was deleted from the database.`);
            } else {
                // If the deleted message doesn't exist in the database, do nothing
                console.log(`Message ID ${message.id} was deleted, but it was not associated with a quote in the database.`);
            }
        } catch (error) {
            console.error('Error while processing message deletion:', error);
        } finally {
            // Close the connection when done
            await client.close();
        }
    },
};

// Path: events/delzitatchannel.js
