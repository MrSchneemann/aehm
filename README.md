
---

# ähm Discord Bot

Welcome to the ähm Discord Bot! This bot is designed to provide various functionalities for managing and displaying quotes within Discord servers.

## Installation

To get started with the bot, follow these steps:

1. **Clone this repository** to your local machine:

```bash
git clone https://github.dev/MrSchneemann/aehm.git
```

2. **Install dependencies**:

```bash
cd aehm
npm install
```

3. **Set up environment variables**:

   Create a `.env` file in the root directory of the project and add the following environment variables:

   ```plaintext
   TOKEN=your-discord-bot-token
   CLIENT_ID=your-discord-client-id
   GUILD_ID=your-discord-guild-id
   MONGODB_URI=your-mongodb-connection-uri
   MONGODB_DBNAME=your-mongodb-database-name
   ALLOWED_USER_ID=your-discord-user-id
   ```

    - Note: `ALLOWED_USER_ID` is the Discord User ID of the Admin user who can execute certain commands.
    - Make sure to replace the placeholders with your actual values.

4. **Deploy commands**:

```bash
node deploy-commands.js
```

This command will deploy the bot's slash commands to your Discord server.

5. **Run the bot**:

```bash
node index.js
```

The bot should now be up and running in your Discord server!

## Commands

### Setup

```plaintext
/setup
```

This command initializes the bot. Only authorized users can execute this command.

### Setup Channel

```plaintext
/setupchannel
```

This command sets up the channel where new Zitate will be automatically added to the database. Only authorized users can execute this command.

### Import Quotes

```plaintext
/import
```

This command imports quotes from a specified channel into the bot's database. Only authorized users can execute this command.

### Zitat

```plaintext
/zitat
```

This command responds with a random quote. It fetches quotes from the configured channel and displays them in an embed.

## Events

The bot handles various events, such as message updates, deletions, and interactions. These events are essential for maintaining the bot's functionality and providing a seamless user experience.

## Contributing

Contributions are welcome! If you have any suggestions, bug fixes, or new features to add, feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](https://opensource.org/license/mit) file for details.

---