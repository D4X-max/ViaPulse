import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Report, WardStats } from '../types';

interface FloatingChatbotProps {
  user: any;
  reports: Report[];
  wardStats: WardStats[];
  onNavigate?: (tabName: 'home' | 'report' | 'tracking' | 'ombudsman' | 'league' | 'scorecard') => void;
  onFilterMap?: (category: string | null) => void;
}

export default function FloatingChatbot({ user, reports = [], wardStats = [], onNavigate, onFilterMap }: FloatingChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    {
      sender: 'bot',
      text: 'Hello! I am your ViaPulse AI Assistant. Ask me anything about civic issues, response times, or tracking reports. You can also command me to "show potholes on the map" or "go to the leaderboard"!',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  const samplePrompts = [
    "Why hasn't my complaint been resolved?",
    "Show potholes on the map",
    "Go to the Leaderboard",
    "What is the average pothole resolution time?"
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'user' as const, text: textToSend, time: timestamp };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Filter user specific reports
      const myReports = reports.filter(r => r.reporterEmail === user?.email);
      const currentUser = user ? { name: user.displayName || 'Citizen', email: user.email } : { name: 'Anonymous Citizen', email: '' };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: textToSend,
          currentUser,
          myReports,
          wardStats
        })
      });

      if (!response.ok) {
        throw new Error('Chat API returned an error status');
      }

      const data = await response.json();
      const rawText = data.text || 'I encountered an issue processing that query.';
      
      // Parse out tool_call block if present
      let cleanText = rawText;
      let toolCallJson: any = null;
      
      const toolCallRegex = /<tool_call>([\s\S]*?)<\/tool_call>/i;
      const match = rawText.match(toolCallRegex);
      if (match && match[1]) {
        try {
          toolCallJson = JSON.parse(match[1].trim());
          // Strip the tool call block from the display text for a pristine user experience
          cleanText = rawText.replace(toolCallRegex, '').trim();
        } catch (e) {
          console.error("Failed to parse tool call JSON", e);
        }
      }

      setMessages(prev => [...prev, {
        sender: 'bot' as const,
        text: cleanText || 'Command executed successfully.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      // If a valid tool call was identified, fire the physical React state modifiers instantly
      if (toolCallJson) {
        const { action, category, tab } = toolCallJson;
        if (action === 'FILTER_MAP' && onFilterMap) {
          onFilterMap(category);
        } else if (action === 'NAVIGATE_TO' && onNavigate && tab) {
          // Normalize the tab value if needed
          let targetTab = tab;
          if (tab === 'leaderboard') targetTab = 'league';
          if (tab === 'analytics') targetTab = 'scorecard';
          onNavigate(targetTab);
        }
      }

    } catch (err) {
      console.error('Error sending message to Gemini Chatbot:', err);
      setMessages(prev => [...prev, {
        sender: 'bot' as const,
        text: 'Sorry, I am unable to connect to the municipal AI ledger right now. Please check your network connection.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[2000] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-80 sm:w-96 h-[480px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-950 to-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">ViaPulse AI Copilot</h4>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Online / Active Node
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages body */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 scrollbar-thin relative">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex items-start gap-2 max-w-[85%] ${
                    msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 border ${
                    msg.sender === 'user' 
                      ? 'bg-indigo-600 border-indigo-500 text-white' 
                      : 'bg-slate-950 border-slate-800 text-emerald-400'
                  }`}>
                    {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className={`p-2.5 rounded-xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600/90 text-white rounded-tr-none whitespace-pre-wrap'
                        : 'bg-slate-950/80 text-slate-200 border border-slate-850 rounded-tl-none whitespace-pre-wrap font-sans'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[8px] text-slate-500 font-mono px-1 self-end">{msg.time}</span>
                  </div>
                </div>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-start gap-2 max-w-[85%] self-start animate-pulse">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 border bg-slate-950 border-slate-800 text-emerald-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="p-2.5 rounded-xl text-xs bg-slate-950/80 text-slate-400 border border-slate-850 rounded-tl-none flex items-center gap-1.5 font-mono">
                      <span>Analyzing municipal ledger...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-850 flex flex-col gap-1.5">
              <span className="text-[9px] text-slate-500 uppercase font-mono tracking-widest">Suggested Queries</span>
              <div className="flex flex-wrap gap-1">
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    disabled={isLoading}
                    onClick={() => handleSend(p)}
                    className="text-[10px] text-slate-300 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Input area */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                disabled={isLoading}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isLoading ? "Please wait..." : "Ask about community validation, status updates..."}
                className="flex-1 bg-slate-900 text-slate-200 placeholder:text-slate-500 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-sans transition-all disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 disabled:text-slate-600 text-slate-950 rounded-xl transition-all shadow-md shadow-emerald-950/30 flex items-center justify-center shrink-0 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-500 text-slate-950 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 border-2 border-emerald-400 focus:outline-none transition-transform z-50 cursor-pointer"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}
