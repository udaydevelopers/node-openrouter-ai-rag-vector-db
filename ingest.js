const fs = require("fs");
const pdfParse = require("pdf-parse");
const lancedb = require("@lancedb/lancedb");

const PDF_FILE = "./documents/django.pdf";
const DB_PATH = "./db";
const TABLE_NAME = "documents";

async function main() {

    // Import Transformers.js as an ES module
    const { pipeline } = await import("@xenova/transformers");

    console.log("Loading embedding model...");

    const extractor = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2"
    );

    console.log("Reading PDF...");

    const pdfBuffer = fs.readFileSync(PDF_FILE);

    const pdfData = await pdfParse(pdfBuffer);

    const text = pdfData.text
        .replace(/\s+/g, " ")
        .trim();

    console.log(`PDF text length: ${text.length}`);

    // -----------------------------
    // Create chunks
    // -----------------------------

    const chunks = [];

    const chunkSize = 1000;
    const overlap = 200;

    for (
        let start = 0;
        start < text.length;
        start += chunkSize - overlap
    ) {

        const chunk = text
            .substring(start, start + chunkSize)
            .trim();

        if (chunk.length > 50) {
            chunks.push(chunk);
        }
    }

    console.log(`Created ${chunks.length} chunks`);

    // -----------------------------
    // Create embeddings
    // -----------------------------

    const records = [];

    for (let i = 0; i < chunks.length; i++) {

        console.log(`Embedding ${i + 1}/${chunks.length}`);

        const output = await extractor(chunks[i], {
            pooling: "mean",
            normalize: true
        });

        const embedding = Array.from(output.data);

        records.push({
            id: `chunk-${i}`,
            text: chunks[i],
            vector: embedding
        });
    }

    // -----------------------------
    // Store in LanceDB
    // -----------------------------

    console.log("Opening LanceDB...");

    const db = await lancedb.connect(DB_PATH);

    await db.createTable(TABLE_NAME, records, {
        mode: "overwrite"
    });

    console.log("\n================================");
    console.log("RAG ingestion completed!");
    console.log("================================");
    console.log(`Stored ${records.length} chunks in LanceDB`);
}

main().catch(error => {
    console.error("\nERROR:");
    console.error(error);
});