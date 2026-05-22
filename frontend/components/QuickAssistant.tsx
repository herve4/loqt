
import React, { useState, useRef, useEffect } from 'react';
import { chatWithAssistant } from '../services/geminiService';

const QuickAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: 'Bonjour ! Je suis LOQT-AI. Comment puis-je vous aider avec votre logistique aujourd\'hui ?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat, isOpen]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMsg = message;
    setMessage('');
    setChat(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    const response = await chatWithAssistant(chat, userMsg);
    setChat(prev => [...prev, { role: 'model', text: response || "Désolé, je n'ai pas pu traiter votre demande." }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-96 bg-slate-900 rounded-[2rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.8)] border border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-950 p-5 text-white flex justify-between items-center border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-blue-600/20">L</div>
              <span className="font-black tracking-tighter uppercase italic">LOQT AI</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-900 text-slate-500 hover:text-white hover:bg-slate-800 transition-all">✕</button>
          </div>

          <div ref={scrollRef} className="flex-1 h-96 p-6 overflow-y-auto space-y-6 bg-slate-950 scrollbar-hide">
            {chat.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-lg ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none shadow-blue-600/10' 
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-black/40'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex gap-1.5 shadow-lg">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-75"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-5 border-t border-slate-800 bg-slate-950">
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="Interrogez la matrice LOQT..."
                className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent placeholder:text-slate-600 transition-all"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend}
                disabled={isLoading}
                className="w-12 h-12 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center text-xl"
              >
                🚀
              </button>
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-[1.5rem] shadow-2xl flex items-center justify-center text-3xl transition-all active:scale-90 group z-50 ${
          isOpen ? 'bg-slate-900 text-blue-500 border border-slate-800 shadow-blue-500/10' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/30'
        }`}
      >
        {isOpen ? '✕' : '✨'}
        {!isOpen && (
          <div className="absolute right-20 px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none shadow-2xl border border-slate-800 translate-x-2 group-hover:translate-x-0">
            Assistant Système
          </div>
        )}
      </button>
    </div>
  );
};

export default QuickAssistant;
