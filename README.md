RAG PDF Chatbot
Node.js + LanceDB + Transformers.js + OpenRouter

This project demonstrates a simple RAG (Retrieval-Augmented Generation) application.

The application:

Reads a PDF document.
Extracts the text.
Splits the text into smaller chunks.
Creates embeddings locally.
Stores embeddings in LanceDB.
Searches the Vector DB when a user asks a question.
Sends the relevant document chunks to OpenRouter.
Generates an answer using a free OpenRouter model.
