const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('query')
        .setDescription('Ask a question about the given channel context.')
        .addStringOption((option) =>
            option.setName('question')
                .setDescription('Ask a question about the given channel context.')
                .setRequired(true)
        ),

    async execute(interaction) { },
};