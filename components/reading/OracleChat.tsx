import React, { useRef, useEffect } from 'react';
import { Language } from '../../types';
import Button from '../Button';
import { Send, Sparkles, Coins } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

interface OracleChatProps {
  language: Language;
  credits: number;
  chatHistory: ChatMessage[];
  chatInput: string;
  isChatLoading: boolean;
  questionCost: number;
  onInputChange: (value: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
}

const OracleChat: React.FC<OracleChatProps> = ({
  language,
  credits,
  chatHistory,
  chatInput,
  isChatLoading,
  questionCost,
  onInputChange,
  onSendMessage
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isChatLoading]);

  return (
    <div className="bg-slate-900 border border-indigo-500/30 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-950/80 to-purple-950/80 px-5 py-4 border-b border-indigo-500/30 flex justify-between items-center">
        <h3 className="font-heading text-lg text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          {language === 'en' ? 'Ask the Oracle' : "Demandez à l'Oracle"}
        </h3>
        <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-600">
          <Coins className="w-4 h-4 text-amber-400" />
          <span className="text-slate-300 text-sm">{language === 'en' ? 'Balance:' : 'Solde:'}</span>
          <span className="text-amber-300 font-bold text-sm">{credits}</span>
        </div>
      </div>

      {/* Chat History */}
      <div className={`overflow-y-auto bg-slate-950/50 transition-all duration-300 ${chatHistory.length > 0 ? 'p-5 max-h-[400px]' : 'py-6 px-5'}`}>
        {chatHistory.length === 0 && (
          <div className="text-center py-4">
            <p className="text-slate-400 text-sm">
              {language === 'en'
                ? 'The cards have spoken. Do you have further questions?'
                : "Les cartes ont parlé. Avez-vous d'autres questions ?"}
            </p>
          </div>
        )}

        {chatHistory.map((msg, idx) => (
          <div key={`chat-${idx}`} className={`flex mb-5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-sm shadow-lg'
                : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {isChatLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-xl rounded-bl-sm px-4 py-3 flex gap-1.5 border border-slate-700">
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={onSendMessage} className="p-4 bg-slate-900/80 border-t border-indigo-500/20 flex gap-3">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={language === 'en' ? 'Ask a follow-up question...' : 'Posez une question de suivi...'}
          className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
        />
        <Button
          type="submit"
          disabled={isChatLoading || !chatInput.trim()}
          className="min-w-[110px]"
        >
          <span className="flex items-center gap-2">
            {isChatLoading ? '...' : <Send className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {questionCost === 0
                ? (language === 'en' ? 'Free' : 'Gratuit')
                : `1 ${language === 'en' ? 'Credit' : 'Crédit'}`}
            </span>
          </span>
        </Button>
      </form>

      {/* Free question hint */}
      <div className="bg-slate-950/80 py-2 text-center border-t border-slate-800">
        <span className="text-xs text-slate-500">
          {language === 'en'
            ? 'First question is free • Every 5th question is free'
            : 'Première question gratuite • Chaque 5ème question est gratuite'}
        </span>
      </div>
    </div>
  );
};

export default OracleChat;
