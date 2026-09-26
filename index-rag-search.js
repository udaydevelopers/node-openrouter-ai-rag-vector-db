require("dotenv").config();

const OpenAI = require("openai");
const lancedb = require("@lancedb/lancedb");
const readline = require("readline");

const DB_PATH = "./db";
const TABLE_NAME = "documents";

// OpenRouter
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let extractor;
let table;

// ------------------------------------
// Initialize
// ------------------------------------

async function initialize() {

    console.log("Loading embedding model...");

    // Transformers.js is ESM
    const { pipeline } = await import("@xenova/transformers");

    extractor = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2"
    );

    console.log("Connecting to LanceDB...");

    const db = await lancedb.connect(DB_PATH);

    table = await db.openTable(TABLE_NAME);

    console.log("RAG system ready!");
}

// ------------------------------------
// Create embedding for question
// ------------------------------------

async function createEmbedding(text) {

    const output = await extractor(text, {
        pooling: "mean",
        normalize: true
    });

    return Array.from(output.data);
}

// ------------------------------------
// Search Vector DB
// ------------------------------------

async function searchDocuments(question) {

    console.log("\nSearching Vector DB...");

    const queryVector = await createEmbedding(question);

    const results = await table
        .vectorSearch(queryVector)
        .limit(3)
        .toArray();

    console.log(`Found ${results.length} relevant chunks`);

    return results;
}

// ------------------------------------
// RAG + OpenRouter
// ------------------------------------

async function askAI(question) {

    const results = await searchDocuments(question);

    // Convert retrieved chunks into context
    const context = results
        .map((item, index) => {
            return `
SOURCE ${index + 1}

${item.text}
`;
        })
        .join("\n-------------------------\n");

    console.log("\nSending context to OpenRouter...");

    const response = await openai.chat.completions.create({

        // Free OpenRouter router
        model: "openrouter/free",

        max_tokens: 1000,

        messages: [

            {
                role: "system",
                content: `
You are a helpful document assistant.

Answer the user's question using ONLY the
information provided in the document context.

If the answer is not present in the context,
say:

"I couldn't find the answer in the document."

Do not make up information.
`
            },

            {
                role: "user",
                content: `
DOCUMENT CONTEXT:

${context}

USER QUESTION:

${question}
`
            }

        ]
    });

    return response.choices[0].message.content;
}

// ------------------------------------
// Chat
// ------------------------------------

function chat() {

    rl.question("\nYou: ", async (question) => {

        if (question.toLowerCase() === "exit") {

            console.log("Goodbye!");

            rl.close();

            return;
        }

        try {

            console.log("\nAI is thinking...");

            const answer = await askAI(question);

            console.log("\n==============================");
            console.log("AI ANSWER");
            console.log("==============================\n");

            console.log(answer);

        } catch (error) {

            console.error("\nERROR:");
            console.error(error.message);

        }

        chat();
    });
}

// ------------------------------------
// Start application
// ------------------------------------

async function main() {

    try {

        await initialize();

        console.log("\n=================================");
        console.log("       PDF RAG CHATBOT");
        console.log("=================================");

        console.log("Ask questions about your PDF.");
        console.log("Type 'exit' to quit.");

        chat();

    } catch (error) {

        console.error("\nSTARTUP ERROR:");
        console.error(error);

    }
}

main();