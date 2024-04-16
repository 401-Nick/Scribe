const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('summary')
        .setDescription('Provides a summary of the current channel.'),

    async execute(interaction) { },
};