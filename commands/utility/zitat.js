const { SlashCommandBuilder } = require('discord.js');
const { MongoClient } = require('mongodb');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('zitat')
        .setDescription('Response with a Zitat!'),
    async execute(interaction, message) {
        // MongoDB connection URI
        const uri = process.env.MONGODB_URI;

        // Create a new MongoClient
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

        try {
            // Connect to the MongoDB cluster
            await client.connect();

            // Access the database and collections
            const database = client.db(process.env.MONGODB_DBNAME);
            const guildSpecificCollection = interaction.guild.id
            const quotesCollection = database.collection(guildSpecificCollection + "_zitate");
            const generalCollection = database.collection(guildSpecificCollection + "_server");
            const count = await quotesCollection.countDocuments();

            if (count < 2) {
                await interaction.reply('There are not enough Zitate, add more!');
                return;
            }

            // Increment the count of command usage
            await generalCollection.updateOne({}, { $inc: { count: 1 } }, { upsert: true });

            // Retrieve the last displayed quote from the general collection
            let { lastQuote } = await generalCollection.findOne();

            // Query to exclude the last displayed quote
            let query = {};
            if (lastQuote) {
                query = { _id: { $nin: [lastQuote._id] } };
            }

            // Fetch a random document from the quotes collection excluding the last quote
            const newQuote = await quotesCollection.aggregate([{ $match: query }, { $sample: { size: 1 } }]).toArray();

            // Store the current quote as the last quote in the general collection
            await generalCollection.updateOne({}, { $set: { lastQuote: newQuote[0] } }, { upsert: true });

            let submitted_by_icon = await interaction.client.users.fetch(newQuote[0].submitted_by_id);
            let submitted_by_icon_url = submitted_by_icon.avatarURL();

            let submitted_by_id = await interaction.client.users.fetch(newQuote[0].submitted_by_id); //submitted_by_id = user_id
            let submitted_by = submitted_by_id.globalName;

            const embed = {
                color: 0x6700cf,
                url: "https://discord.com",
                author: {
                    url: "https://discord.com",
                    icon_url: submitted_by_icon_url,
                    name: "Submitted by " + submitted_by,
                },
                footer: {
                    text: "Bot by _nwy | Made in Germany",
                    icon_url: "https://cdn.discordapp.com/avatars/691965041594990603/cb60ae89dbec65244c512bfc309d7205?size=1024",
                },
                fields: [
                    {
                        name: 'Zitat by ' + newQuote[0].author_name + ':',
                        value: newQuote[0].zitat_text,
                        inline: true,
                    },
                ],
            };

            // Reply with the embed
            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.reply('There was a problem retrieving the Zitat!');
        } finally {
            // Close the connection when done
            await client.close();
        }
    },
};

// Path: commands/utility/zitat.js
