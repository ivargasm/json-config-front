"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, Loader2 } from 'lucide-react';
import { sendMobileReportChat } from '../../lib/api';
import { useMobileReportStore } from '../../store/mobileReportStore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatPanel() {
    const chatMessages = useMobileReportStore(state => state.chatMessages);
  const setChatMessages = useMobileReportStore(state => state.setChatMessages);
  const messages = chatMessages;
  const setMessages = setChatMessages;
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { components, filters } = useMobileReportStore();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const apiMessages = [...messages.filter(m => m.role === 'user' || m.role === 'assistant').slice(1), { role: 'user', content: userMsg }];
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const data = await sendMobileReportChat(
        apiMessages, 
        useMobileReportStore.getState().components, 
        backendUrl
      );

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || "Hecho." }]);
      
      if (data.components && Array.isArray(data.components)) {
        useMobileReportStore.getState().setComponents(data.components);
      }
      
      setIsTyping(false);

    } catch (e: any) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Hubo un error de conexin.' }]);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-slate-50 relative">
      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gradient-to-br from-fuchsia-500 to-indigo-600 text-white shadow-sm'}`}>
              {msg.role === 'user' ? <User size={14} /> : <Bot size={16} />}
            </div>
            <div className={`text-sm px-4 py-2.5 rounded-2xl max-w-[85%] ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 shadow-sm rounded-tl-none leading-relaxed'}`}>
              {msg.content.split('\n').map((line, i) => <React.Fragment key={i}>{line.replace(/\*\*/g, '')}<br/></React.Fragment>)}
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-fuchsia-500 to-indigo-600 text-white shadow-sm">
               <Loader2 size={14} className="animate-spin" />
             </div>
             <div className="text-sm px-4 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm rounded-tl-none">
               <span className="flex gap-1">
                 <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                 <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                 <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
               </span>
             </div>
           </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-slate-200">
        <div className="relative flex items-center">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pdele a la IA que cree o edite..."
            className="w-full bg-slate-100 border-none rounded-full pl-4 pr-12 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            disabled={isTyping}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-1 w-8 h-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-full transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 mt-2">La IA tiene contexto de tu JSON actual.</p>
      </div>
    </div>
  );
}