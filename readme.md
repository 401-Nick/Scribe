# Discord Bot

This is a Discord bot is named Scribe.

## Features

- `/summary` - Gets a summary of the last __ messages in the channel.
- `/query` - Queries the current channel against a user input.

## Bot Setup Guide

### Running the bot

1. Rename `.env.example` to `.env` and fill in the necessary information.
2. Run `npm install` to install the necessary packages.
3. Run `node bot.js` to start the bot.

### Bot creation and environment variables

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and create a new application.
2. Go to the OAuth2 tab and copy the client ID to `.env`.
3. Go to the Bot tab and copy the token to `.env`.

### Adding the bot to a server

1. Go to the OAuth2 tab and select the bot scope.
2. Select `application.commands` and `bot` permissions.
3. In the bot permissions, select `SEND MESSAGES`, `READ/VIEW CHANNELS`, `USE SLASH COMMANDS`, and `READ MESSAGE HISTORY`.
4. Use the generated URL to add the bot to a server.
5. Make sure the bot has proper role permissions in the server.