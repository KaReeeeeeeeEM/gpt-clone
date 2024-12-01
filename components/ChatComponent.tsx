/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useRef } from "react";
import Spinner from "./Spinner";
import Link from "next/link";
import { FaArrowDown } from "react-icons/fa";
import AutomateType from "./AutomateType";
import { motion, useScroll } from "framer-motion";
import { MdAttachFile } from "react-icons/md";
import FormatText from "./FormatText";

const ChatComponent = () => {
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [clicked, setClicked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResponse(null);
    setPrompt("");
    setIsLoading(true);

    // Check if a file is selected
    if (file) {
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64File = reader.result.toString().split(",")[1];
        if (!base64File) {
          setError("Failed to read file");
          return;
        } else {
          console.log("File read successfully");
        }

        try {
          const res = await fetch("/api/gemini", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt,
              file: base64File,
            }),
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
          setFile(null);
        } catch (err) {
          setIsLoading(false);
          console.log("Error fetching response:", err);
          setError("Failed to connect to API");
        }
      };

      reader.readAsDataURL(file);
    } else {
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
        console.log(data.result);
        setIsLoading(false);
        setResponse(data.result);
        setClicked(false);
      } catch (err) {
        setIsLoading(false);
        console.log("Error fetching response:", err);
        setError("Failed to connect to API");
      }
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
            <div className="w-full h-full text-md md:text-lg flex items-center justify-center text-center text-white">
              <AutomateType
                text="Hi there! I'm a GPT-clone. Ask me anything!"
                speed={50}
              />
            </div>
          )}
          {response &&
            response.map((item: any, index: number) => (
              <div
                key={index}
                className={`w-full flex items-center ${
                  item.role === "user" ? "justify-end" : "justify-start"
                } mb-8 md:mb-20`}
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
            className="relative w-full mt-2 text-md bg-slate-600 py-2 px-8 outline-none focus:outline-slate-700"
            placeholder="Enter your prompt here"
          />
          <div className="absolute top-4 left-3">
            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => {
                  setFile(e.target.files[0]);

                  if (!e.target.files[0].name.match(/\.(pdf)$/)) {
                    alert(
                      "Only PDF format is allowed! Please upload a valid PDF document."
                    );
                    return;
                  }
                  alert(`${e.target.files[0].name} uploaded successfully!`);
                }}
                accept="*/*"
              />

              {/* Custom button with icon */}
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="flex items-center justify-center w-10 h-10 text-gray-800 rounded-full focus:outline-none"
              >
                <MdAttachFile className="h-6 w-6 text-slate-300 rotate-45" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!prompt || isLoading || !file}
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
