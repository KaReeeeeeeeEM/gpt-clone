"use client";

import { useState } from "react";
import Spinner from "./Spinner";
import Link from "next/link";
import { FaArrowDown } from "react-icons/fa";
import { motion, useScroll } from "framer-motion";

interface FormatTextProps {
  input?: string;
}

function FormatText({ input }: FormatTextProps): JSX.Element {
  // Handle block code (```)
  const blockCodePattern = /```([\s\S]*?)```/g;
  input = input.replace(blockCodePattern, (match: string, code: string) => {
    return `<pre class="bg-black rounded-lg p-3 w-full overflow-x-auto my-2">
    <code>
    <span class="font-bold text-slate-400 italic">&lang; &rang; ${
      code.split(" ")[0]
    }</span>${code.split(" ").slice(1).join(" ").trim()}</code></pre>`;
  });

  // Handle inline code (`)
  const inlineCodePattern = /`([^`]+)`/g;
  input = input.replace(inlineCodePattern, (match: string, code: string) => {
    return `<code class="bg-slate-700 px-3 rounded text-white font-bold">${code.trim()}</code>`;
  });

  // Handle bold (**)
  const boldPattern = /\*\*(.*?)\*\*/g;
  input = input.replace(boldPattern, (match: string, boldText: string) => {
    return `<strong>${boldText.trim()}</strong>`;
  });

  // Handle unordered lists (*)
  const unorderedListPattern = /\* (.*?)(?=\n|\*|\Z)/g;
  input = input.replace(
    unorderedListPattern,
    (match: string, content: string) => {
      return `<li>${content.trim()}</li>`;
    }
  );

  // Format ordered lists (1. ... 10.)
  const listPattern = /(\d+)\.\s(.*?)(?=(\d+\.\s|\Z))/g;
  input = input.replace(listPattern, (match, number, content) => {
    return `<li><strong>${number}.</strong> ${content.trim()}</li>`;
  });

  // Wrap ordered or unordered list items in <ol> or <ul>
  if (/<li>/.test(input)) {
    // If there are <li> tags, wrap them in <ol> or <ul>
    if (/(\d+\.\s)/.test(input)) {
      input = input.replace(
        /(<li>.*<\/li>)/g,
        `<ol class="list-decimal ml-6">$1</ol>`
      );
    } else {
      input = input.replace(
        /(<li>.*<\/li>)/g,
        `<ul class="list-disc ml-6">$1</ul>`
      );
    }
  }

  // Ensure paragraphs are created for non-list content
  input = input.replace(/([^\n]+)\n/g, (match, content) => {
    return `<p>${content.trim()}</p>`;
  });

  // Return the formatted content rendered as HTML
  return <div dangerouslySetInnerHTML={{ __html: input }} />;
}

const ChatComponent = () => {
  const [prompt, setPrompt] = useState("");
  const [clicked, setClicked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { scrollYProgress } = useScroll();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResponse(null);
    setPrompt("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "An unknown error occurred");
        return;
      }
      const data = await res.json();
      setIsLoading(false);
      setResponse(data.result);
      setClicked(false);
    } catch (err) {
      setIsLoading(false);
      console.log("Error fetching response:", err);
      setError("Failed to connect to API");
    }
  };

  return (
    <>
    <div className={`w-full h-[50vh] overflow-y-auto px-2`}>
      {/* text messages */}
      <motion.div
        className={`w-full flex flex-col justify-between items-center my-4`}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        whileInView={{ opacity: 1 }}
      >
        {isLoading && <Spinner />}
        {error && <div className="text-red-500">{error}</div>}
        {!response && !isLoading && !error && (
          <div className="text-center text-white">
            <h2 className="text-lg font-bold">
              Hello, how can I assist you today?
            </h2>
            <p>
              Start a quick conversation on any topic eg: How can i bake a cake?
            </p>
          </div>
        )}
        {response &&
          response.map((item: any, index: number) => (
            <div
              key={index}
              className={`w-full flex items-center ${
                item.role === "user" ? "justify-end" : "justify-start"
              } mb-16`}
            >
              <motion.div
                className={`md:max-w-[60%] h-auto overflow-y-auto bg-${
                  item.role === "user" ? "blue" : "slate"
                }-600 text-white p-2 rounded-md my-1`}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
              >
                <FormatText input={item.parts[0]?.text} />
              </motion.div>
            </div>
          ))}
      </motion.div>
      <div id="bottom"></div>
      {clicked === false && response !== null && response.length > 3 && (
        <Link
          onClick={() => setClicked(true)}
          className={`animate-bounce w-8 h-8 mx-auto rounded-full flex items-center justify-center p-2 bg-slate-400 mb-16 absolute bottom-8 inset-x-0 z-10 ${
            !response && "hidden"
          }`}
          href="#bottom"
        >
          <FaArrowDown className="text-slate-800 font-bold w-4 h-4" />
        </Link>
      )}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-800 w-full absolute bottom-0 left-0 mt-12 px-4 pt-2 rounded-b-lg pb-4"
      >
        <textarea
          name="prompt"
          id="prompt"
          value={prompt}
          autoFocus={true}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          onChange={(e) => setPrompt(e.target.value)}
          className="relative w-full mt-2 text-md bg-slate-600 p-2 outline-none focus:outline-slate-700"
          placeholder="Enter your prompt here"
        />

        <button
          type="submit"
          disabled={!prompt || isLoading}
          className={`absolute bottom-8 right-6 rounded-md bg-blue-600 px-4 py-2 font-bold mt-2 disabled:opacity-60`}
        >
          Send
        </button>
      </form>
    </div>
    </>
  );
};

export default ChatComponent;
