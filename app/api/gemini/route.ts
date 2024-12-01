/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import fs from "fs";

// Persistent conversation history (could be stored in a database for multi-user systems)
const conversationHistory: any = [];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB (adjust as necessary)
const MAX_FILENAME_LENGTH = 255; // Max length for filenames

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key is missing. Check your environment variables." },
      { status: 500 }
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const fileManager = new GoogleAIFileManager(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Parse the request to get the user's input and file (if provided)
  const { prompt, file } = await request.json();

  if (!prompt && !file) {
    return NextResponse.json(
      { error: "Either a prompt or a file is required." },
      { status: 400 }
    );
  }

  let aiResponse = "";

  try {
    if (file) {
      // Check if the file size is within the limit
      const base64Size = Buffer.byteLength(file, "base64");
      if (base64Size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "File is too large. Max size is 10MB." },
          { status: 400 }
        );
      }

      // Handle base64 file if provided
      const buffer = Buffer.from(file, "base64");

      // Write the decoded data to a PDF file
      await fs.promises.writeFile("docs/decoded_output.pdf", buffer);
      console.log("PDF decoded and saved as decoded_output.pdf");

      // Upload the file using GoogleAIFileManager (pass the buffer here)
      const uploadResponse = await fileManager.uploadFile(
        "docs/decoded_output.pdf",
        {
          mimeType: "application/pdf",
          displayName: "Uploaded file",
        }
      );

      console.log(
        `Uploaded file ${uploadResponse.file.displayName} as: ${uploadResponse.file.uri}`
      );

      // Generate content using the uploaded file and prompt
      const result = await model.generateContent([
        {
          fileData: {
            mimeType: uploadResponse.file.mimeType,
            fileUri: uploadResponse.file.uri,
          },
        },
        { text: prompt || "Provide a summary of this file." },
      ]);

      conversationHistory.push({
        role: "user",
        parts: [
          {
            text: `Uploaded file ${uploadResponse.file.displayName} as: ${uploadResponse.file.uri}`,
          },
        ],
      });

      // Add the AI's response to the conversation history
      conversationHistory.push({
        role: "model",
        parts: [{ text: result.response.text() }],
      });

    } else {
      // Add the user's input to the conversation history (when no file is provided)
      conversationHistory.push({
        role: "user",
        parts: [{ text: prompt }],
      });

      // Start a chat session with the current conversation history
      const chat = model.startChat({
        history: conversationHistory,
      });

      // Get the AI's response
      const result = await chat.sendMessageStream(prompt);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        aiResponse += chunkText;
      }

      // Add the AI's response to the conversation history
      conversationHistory.push({
        role: "model",
        parts: [{ text: aiResponse }],
      });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: `Error processing the request: ${error.message}`,
        details: error,
      },
      { status: 500 }
    );
  }

  console.log(
    conversationHistory.map((item: any) => item.parts[0].text).join("\n")
  );

  // Return the updated conversation history or AI response
  return NextResponse.json({
    result: conversationHistory,
  });
}
