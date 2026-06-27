import React, { useState } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    {
      sender: 'bot',
      text: 'Hello! I am your ViaPulse AI Assistant. Ask me anything about civic issues, response times, or tracking reports.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');

  const samplePrompts = [
    "Why hasn't my complaint been resolved?",
    "How do I earn Hero Points?",
    "What is the average pothole resolution time?"
  ];

  const handleSend = (textToSend: string) => {
    if (!textToSend.trim()) return;
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'user' as const, text: textToSend, time: timestamp };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      let botResponse = "I am processing your inquiry across our autonomous civic nodes. Please feel free to check the public indexes for exact SLA statistics.";
      const lowerText = textToSend.toLowerCase();

      if (lowerText.includes("why hasn't my complaint") || lowerText.includes("complaint been resolved") || lowerText.includes("resolved")) {
        const options = [
          "It is currently awaiting community validation,",
          "Similar issues in this ward usually take 3 days to secure municipal clearance,",
          "This specific grid sector already has 5 active reports. Your entry has been securely merged."
        ];
        // Pick one randomly or combine them for realism
        botResponse = `${options[0]} and is undergoing active telemetry scans. Additionally, ${options[1].toLowerCase()} and ${options[2].toLowerCase()}`;
      } else if (lowerText.includes("hero") || lowerText.includes("point") || lowerText.includes("gamification") || lowerText.includes("badge")) {
        botResponse = "You earn Hero Points (PTS) by reporting new active hazards (+150 PTS), confirming community issues (+50 PTS), or providing comments and visual verifications (+100 PTS). Collect achievements like Road Hero 🏆 and Water Warrior 💧 to climb the ladder!";
      } else if (lowerText.includes("pothole") || lowerText.includes("time") || lowerText.includes("resolution")) {
        botResponse = "According to our municipal scorecard and real-time SLA trackers, the average resolution time for high-severity pothole repair works is currently 36.4 hours, with a 94.2% municipal satisfaction rating.";
      }

      setMessages(prev => [...prev, {
        sender: 'bot' as const,
        text: botResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1000);
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
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 scrollbar-thin">
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
                        ? 'bg-indigo-600/90 text-white rounded-tr-none'
                        : 'bg-slate-950/80 text-slate-200 border border-slate-850 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[8px] text-slate-500 font-mono px-1 self-end">{msg.time}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Prompts */}
            <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-850 flex flex-col gap-1.5">
              <span className="text-[9px] text-slate-500 uppercase font-mono tracking-widest">Suggested Queries</span>
              <div className="flex flex-wrap gap-1">
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(p)}
                    className="text-[10px] text-slate-300 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-left transition-all"
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
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about community validation, status updates..."
                className="flex-1 bg-slate-900 text-slate-200 placeholder:text-slate-500 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-sans transition-all"
              />
              <button
                type="submit"
                className="p-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl transition-all shadow-md shadow-emerald-950/30 flex items-center justify-center shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
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
