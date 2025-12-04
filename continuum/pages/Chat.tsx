
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../contexts/StoreContext';
import { chatWithMemories } from '../services/geminiService';
import { ChatMessage } from '../types';
import { Button, Input } from '../components/UI';
import { Send, Sparkles, User, Bot, Trash2, Loader2 } from 'lucide-react';

export const Chat: React.FC = () => {
  const { profile, memories, chatHistory, addChatMessage, clearChat } = useStore();
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isProcessing]);

  const handleSend = async () => {
    if (!input.trim() || !profile) return;
    
    const query = input;
    setInput('');
    setIsProcessing(true);

    // 1. Add User Message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date().toISOString()
    };
    addChatMessage(userMsg);

    try {
      // 2. Call Gemini
      const responseText = await chatWithMemories(query, chatHistory, profile, memories);
      
      // 3. Add AI Message
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString()
      };
      addChatMessage(aiMsg);
    } catch (e) {
      console.error(e);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble accessing your memories right now. Please try again.",
        timestamp: new Date().toISOString()
      };
      addChatMessage(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    "What are my main goals right now?",
    "Summarize my recent notes.",
    "Did I mention any book recommendations?",
    "What is pending on my todo list?"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-80px)] max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4 px-2">
        <div>
           <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
             <Sparkles className="w-6 h-6 text-blue-600" />
             Ask Continuum
           </h1>
           <p className="text-sm text-gray-500">Your second brain, ready to answer.</p>
        </div>
        {chatHistory.length > 0 && (
          <Button variant="ghost" onClick={clearChat} icon={Trash2} className="text-gray-400 hover:text-red-600">
            Clear Chat
          </Button>
        )}
      </div>

      {/* Chat Window */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
               <Bot className="w-12 h-12 text-gray-300 mb-4" />
               <p className="text-gray-500 font-medium mb-6">Ask me anything about your saved memories.</p>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                 {suggestions.map((s, i) => (
                   <button 
                     key={i} 
                     onClick={() => setInput(s)}
                     className="text-sm text-gray-600 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-100 rounded-lg p-3 transition-colors text-left"
                   >
                     {s}
                   </button>
                 ))}
               </div>
            </div>
          ) : (
            <>
              {chatHistory.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-gray-900 text-white rounded-br-none' 
                      : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-bl-none'
                  }`}>
                    {msg.content}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                  )}
                </div>
              ))}
              {isProcessing && (
                <div className="flex gap-3 justify-start">
                   <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
                       <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                       <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                       <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-gray-50 border-t border-gray-100">
           <div className="relative flex items-center">
             <Input 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={handleKeyDown}
               placeholder="Ask about your memories..."
               className="pr-12 py-3 shadow-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500/10"
               disabled={isProcessing}
             />
             <button 
               onClick={handleSend}
               disabled={!input.trim() || isProcessing}
               className="absolute right-2 p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
             >
               {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
             </button>
           </div>
           <p className="text-[10px] text-gray-400 mt-2 text-center">
             Continuum uses your memory log to answer. It may not recall details not explicitly saved.
           </p>
        </div>
      </div>
    </div>
  );
};
