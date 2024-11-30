/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";

interface AutomateTypeProps {
  text: string; 
  speed?: number;
}

export default function AutomateType({ text, speed = 100 }: AutomateTypeProps){
  const [displayedText, setDisplayedText] = useState(""); 
  const [index, setIndex] = useState(0); 

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]); 
        setIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timeout); 
    }
  }, [index, text, speed]);

  return <span>{displayedText}</span>;
};