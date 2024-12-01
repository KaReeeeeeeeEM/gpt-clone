/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";

interface FormatTextProps {
    input?: string;
  }
  
  export default function FormatText({ input }: FormatTextProps): JSX.Element {
    const [copied, setCopied] = useState(false);
    const codeId = `code-${Math.random().toString(36).substring(2, 10)}`;
  
    const handleCopy = (code: string) => {
      navigator.clipboard
        .writeText(code)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          alert("Failed to copy code.");
        });
    };
  
    // Handle block code (```)
    const blockCodePattern = /```([\s\S]*?)```/g;
  
    const escapeHtml = (unsafe: string) => {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };
  
    input = input.replace(blockCodePattern, (match: string, code: string) => {
        const trimmedCode = code.trim().toString();
        return `
           <div class="relative group">
            <pre class="bg-black rounded-lg p-3 w-full overflow-x-auto my-2">
              <code>
                <span class="font-bold text-slate-400 italic">&lang; &rang; ${
                  trimmedCode.split(" ")[0]
                }</span>${trimmedCode.split(" ").slice(1).join(" ")}
              </code>
            </pre>
            <button class="copy-btn absolute top-2 right-2 bg-gray-700 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity" data-code="${escapeHtml(
              trimmedCode
            )}">
              Copy
            </button>
          </div>`;
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
  
    // Wrap list items in <ul> or <ol>
    const unorderedListPattern = /\* (.*?)(?=\n|\*|\Z)/g;
    input = input.replace(
      unorderedListPattern,
      (match: string, content: string) => `<li>${content.trim()}</li>`
    );
  
    const listPattern = /(\d+)\.\s(.*?)(?=(\d+\.\s|\Z))/g;
    input = input.replace(listPattern, (match, number, content) => {
      return `<li><strong>${number}.</strong> ${content.trim()}</li>`;
    });
  
    // Ensure paragraphs are created for non-list content
    input = input.replace(/([^\n]+)\n/g, (match, content) => {
      return `<p>${content.trim()}</p>`;
    });
  
    // Return the formatted content rendered as HTML
    return (
      <div
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.classList.contains("copy-btn")) {
            const code = target.getAttribute("data-code");
            if (code) handleCopy(code);
          }
        }}
        dangerouslySetInnerHTML={{
          __html: input,
        }}
      />
    );
  }