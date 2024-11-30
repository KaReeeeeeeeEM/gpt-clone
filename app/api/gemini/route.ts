/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Persistent conversation history (could be stored in a database for multi-user systems)
const conversationHistory : any = [];

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key is missing. Check your environment variables." },
      { status: 500 }
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Parse the request to get the user's input
  const { prompt } = await request.json();
  if (!prompt) {
    return NextResponse.json(
      { error: "Prompt is required." },
      { status: 400 }
    );
  }

  // Add the user's input to the conversation history
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
  let aiResponse = "";

  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    aiResponse += chunkText;
  }

  // Add the AI's response to the conversation history
  conversationHistory.push({
    role: "model",
    parts: [{ text: aiResponse }],
  });

  console.log(conversationHistory.map((item: any) => item.parts[0].text).join("\n"));

  // Return the updated conversation history
  return NextResponse.json({ result : conversationHistory });
}
