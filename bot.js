const { Client, Events, GatewayIntentBits } = require('discord.js');
const dotenv = require('dotenv').config();
const fs = require('fs');
const { deployCommands } = require('./commands.js');
const { summarizeChannel, queryChannel } = require('./llm.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

if (!process.env.DISCORD_TOKEN) {
    console.error('DISCORD_TOKEN is not set in the environment variables.');
    process.exit(1);
}

if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data');
}

//This function fetches messages from a specified channel in a guild and writes them to a JSON file of the same name.
async function fetchMessages(channel, guildName) {
    try {
        const path = `./data/${guildName}/${channel.name}.json`;
        const messages = await channel.messages.fetch();
        const messageData = messages.filter(m => m.author.username !== 'scribe').map(message => {
            return {
                username: message.author.username,
                timestamp: message.createdAt.toISOString(),
                message: message.content
            };
        });

        fs.writeFileSync(path, JSON.stringify(messageData, null, 2));
    } catch (error) {
        fs.appendFileSync('./logs.txt', `{"server": "${channel.guild.name}", "channel": "${channel.name}", "error": "${error}"}\n`);
    }
}

//This function verifies that the guild has a data directory and then scrapes the channel for messages.
async function scrapeChannel(channel) {
    if (channel.type === 0) {
        if (!fs.existsSync(`./data/${channel.guild.name}`)) {
            fs.mkdirSync(`./data/${channel.guild.name}`);
        }
        await fetchMessages(channel, channel.guild.name);
    }
}

//This event listener is triggered when the bot starts
client.once(Events.ClientReady, async () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    client.guilds.cache.forEach(guild => {
        guild.channels.cache.forEach(scrapeChannel);
        deployCommands([guild.id]);
    });
});

//This event listener is triggered when the bot joins a new guild
client.on(Events.GuildCreate, guild => {
    if (!fs.existsSync(`./data/${guild.name}`)) {
        fs.mkdirSync(`./data/${guild.name}`);
    }
    guild.channels.cache.forEach(scrapeChannel);
    deployCommands([guild.id]);
});

//This event listener is triggered when a message is sent in a text channel
client.on(Events.MessageCreate, message => {
    if (message.author.bot || message.channel.type !== 'GUILD_TEXT') return;
    const path = `./data/${message.guild.name}/${message.channel.name}.json`;
    const messageObject = {
        username: message.author.username,
        timestamp: new Date().toISOString(),
        message: message.content
    };

    let messages = [];
    if (fs.existsSync(path)) {
        messages = JSON.parse(fs.readFileSync(path, 'utf8'));
    }
    messages.push(messageObject);
    fs.writeFileSync(path, JSON.stringify(messages, null, 2));
});

//This event listener is triggered when a slash command is used
client.on(Events.InteractionCreate, async interaction => {
    fs.appendFileSync('./logs.txt', `User: ${interaction.user.tag} | in: ${interaction.guild.name}/${interaction.channel.name} | issued command: ${interaction.commandName}\n`);
    console.log(`User: ${interaction.user.tag} | in: ${interaction.guild.name}/${interaction.channel.name} | issued command: ${interaction.commandName}`)
    if (!interaction.isCommand()) return;
    await interaction.deferReply({ ephemeral: true });
    await scrapeChannel(interaction.channel);
    try {
        if (interaction.commandName === 'summary') {
            const summary = await summarizeChannel(interaction);

            await interaction.editReply(summary);
        } else if (interaction.commandName === 'query') {
            const query = interaction.options.getString('question')
            const response = await queryChannel(interaction, query);

            await interaction.editReply(response);
        } else {
            await interaction.editReply('Unknown command');
        }
    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.login(process.env.DISCORD_TOKEN);
