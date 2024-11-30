"use client"
import ChatComponent from "@/components/ChatComponent";

export default function Home() {
  

  return (
   <div className={`flex h-screen md:min-h-screen flex-col items-center justify-center py-8 px-2 lg:p-16 `}>
     <div className="relative bg-slate-800 p-3 w-full md:w-[70vw] h-full md:h-auto rounded-lg text-white">
        <h2 className="text-center text-2xl font-bold mb-6 shadow-sm py-4">Chat With Me (gpt-clone)</h2>
        <ChatComponent />
     </div>
   </div>
  );
}
