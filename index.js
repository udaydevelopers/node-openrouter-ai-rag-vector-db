require("dotenv").config();

const OpenAI = require("openai");

const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY
});

async function main() {
    const response = await client.chat.completions.create({
    model: "openai/gpt-4o",
    max_tokens: 1000,
    messages: [
        {
            role: "user",
            content: "Explain React hooks in simple terms."
        }
    ]
});

    console.log(response.choices[0].message.content);
}

main();