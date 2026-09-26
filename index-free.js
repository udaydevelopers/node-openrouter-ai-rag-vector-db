require("dotenv").config();

const OpenAI = require("openai");
const readline = require("readline");

const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function askAI(question) {
    try {
        const response = await client.chat.completions.create({
            model: "openrouter/free",
            max_tokens: 1000,
            messages: [
                {
                    role: "system",
                    content: "You are a helpful AI coding assistant."
                },
                {
                    role: "user",
                    content: question
                }
            ]
        });

        return response.choices[0].message.content;

    } catch (error) {
        return `Error: ${error.message}`;
    }
}

function chat() {
    rl.question("\nYou: ", async (question) => {

        if (question.toLowerCase() === "exit") {
            console.log("Goodbye!");
            rl.close();
            return;
        }

        console.log("\nAI: Thinking...\n");

        const answer = await askAI(question);

        console.log(answer);

        chat();
    });
}

console.log("================================");
console.log("   OpenRouter Free AI Demo");
console.log("================================");
console.log("Type 'exit' to quit.");

chat();