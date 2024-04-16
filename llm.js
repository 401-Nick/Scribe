const Groq = require("groq-sdk");
const fs = require('fs');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

//./helpers/token-logging.js 
let hasTrackerStarted = false;
let usage;

let tokenUsage = {
    totalTokens: 0,
    limitPerMinute: 30000, // Default limit
    resetInterval: null
};
function logTokenUsage(usedTokens) {
    tokenUsage.totalTokens += usedTokens;
    let usagePercentage = (tokenUsage.totalTokens / tokenUsage.limitPerMinute) * 100;
    usage = `(${usagePercentage.toFixed(2)})%`;
    console.log(`Current token usage:${usage} %)`);
}
function ensureTrackerStarted() {
    if (!hasTrackerStarted) {
        startTokenUsageTracker();
        hasTrackerStarted = true;
    }
}
function startTokenUsageTracker() {
    if (tokenUsage.resetInterval) clearInterval(tokenUsage.resetInterval);
    tokenUsage.resetInterval = setInterval(() => {
        console.log(`Resetting token usage. Total tokens used this minute: ${tokenUsage.totalTokens}`);
        tokenUsage.totalTokens = 0;
    }, 60000);
}
//./helpers/token-logging.js

//This function takes in a JSON object of messages and the task that the user wants to complete.
async function getGroqCompletion(messages, task) {
    try {
        ensureTrackerStarted();

        const formattedMessages = messages.map(message => {
            return `${message.username} at ${message.timestamp}: ${message.message}`;
        }).join('\n');

        const date = new Date();
        const userMessage = `${task}\n\nCurrent time: ${date.toISOString()}\n\nMESSAGES:\n${formattedMessages}`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are scribe. You provide context on discord chat logs." },
                {
                    role: "user",
                    content: userMessage
                }
            ],
            model: "llama2-70b-4096",
            max_tokens: 400
        });

        logTokenUsage(completion.usage.total_tokens);
        return completion;
    } catch (error) {
        console.error("Error in getGroqCompletion:", error);
        throw error;
    }
}

//This function abstracts the process of summarizing a channel's chat logs.
async function summarizeChannel(interaction) {
    try {
        const messages = await getChatLogs(interaction);
        const completion = await getGroqCompletion(messages, `summarize topics of discussion over the past 24 hours`);

        return `Token rate-limit/min: ${usage}\n${completion.choices[0].message.content}`;
    } catch (error) {
        console.error("Error in summarizeChannel:", error);
        throw error;
    }
}

//This function abstracts the process of querying a channel's chat logs.
async function queryChannel(interaction, query) {
    try {
        console.log("querying channel")
        const messages = await getChatLogs(interaction);
        const completion = await getGroqCompletion(messages, `ask a question about the given channel context, USER QUERY: ${query}`);

        return `Token rate-limit/min: ${usage}\n${completion.choices[0].message.content}`;
    } catch (error) {
        console.error("Error in queryChannel:", error);
        throw error;
    }
}

//This is a helper function that takes an interaction and returns a JSON object containing the chat logs of the channel.
async function getChatLogs(interaction, numMessages = 40) {
    try {
        const filePath = `./data/${interaction.channel.guild.name}/${interaction.channel.name}.json`;
        const dataString = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(dataString)
        const messages = jsonData.slice(0, numMessages);

        return messages
    } catch (error) {
        console.error("Error in getChatLogs:", error);
        throw error;
    }
}

module.exports = { summarizeChannel, queryChannel };