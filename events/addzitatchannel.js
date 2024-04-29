const { Events } = require('discord.js');
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

module.exports = {
    name: Events.MessageCreate,
    on: true,
    async execute(message) {
        if (message.author.bot) return;

        const content = message.content.trim();
        const match = content.match(/^(.+?)\s*[-~]\s*(.+?)$/);
        if (!match) return;

        // Connect to the MongoDB cluster
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();

        // Access the database and collection
        const database = client.db(process.env.MONGODB_DBNAME);
        const guildSpecificCollection = message.guild.id
        const quotesCollection = database.collection(guildSpecificCollection + "_zitate");
        const serverCollection = database.collection(guildSpecificCollection + "_server");
        const result = await serverCollection.findOne({ _id: "config" });
        const channelId = result.channel_zitat_id;

        try {
            if (message.channel.id !== channelId) return;

            const content = message.content.trim();
            const match = content.match(/^(.+?)\s*[-~]\s*(.+?)$/);

            const zitat_text = match[1].trim();
            const author_name = match[2].trim();
            const submitted_by_id = message.author.id;
            const message_id = message.id;

            // Insert the zitat, author, submittor, and messageId into the database
            await quotesCollection.insertOne({ zitat_text, author_name, submitted_by_id, message_id });

            await message.react("✏️");
            await message.reactions.removeAll();
            await message.react("👍");

            // Close the connection when done
            await client.close();
        } catch (error) {
            console.error('Error while processing message:', error);
        }
    },
};

// Path: events/addzitatchannel.js
