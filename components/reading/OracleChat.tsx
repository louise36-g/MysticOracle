import React, { useRef, useEffect } from 'react';
import { Language } from '../../types';
import Button from '../Button';
import { Send, Sparkles } from 'lucide-react';

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
      <div className="bg-indigo-950/50 p-4 border-b border-indigo-500/20 flex justify-between items-center">
        <h3 className="font-heading text-lg text-indigo-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          {language === 'en' ? 'Ask the Oracle' : "Demandez à l'Oracle"}
        </h3>
        <div className="text-xs text-slate-400">
          {credits} {language === 'en' ? 'Credits' : 'Crédits'}
        </div>
      </div>

      {/* Chat History */}
      <div className={`overflow-y-auto bg-slate-950/30 transition-all duration-300 ${chatHistory.length > 0 ? 'p-4 max-h-[400px]' : 'py-2'}`}>
        {chatHistory.length === 0 && (
          <div className="text-center text-slate-500 text-xs italic opacity-70">
            {language === 'en'
              ? 'The cards have spoken. Do you have further questions?'
              : "Les cartes ont parlé. Avez-vous d'autres questions ?"}
          </div>
        )}

        {chatHistory.map((msg, idx) => (
          <div key={`chat-${idx}`} className={`flex mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white rounded-br-none'
                : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {isChatLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-lg p-3 rounded-bl-none flex gap-1">
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100"></span>
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200"></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={onSendMessage} className="p-4 bg-indigo-950/30 border-t border-indigo-500/20 flex gap-2">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={language === 'en' ? 'Ask a follow-up question...' : 'Posez une question de suivi...'}
          className="flex-1 bg-slate-900 border border-indigo-500/30 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
        />
        <Button
          type="submit"
          disabled={isChatLoading || !chatInput.trim()}
          className="min-w-[100px]"
        >
          <span className="flex items-center gap-2">
            {isChatLoading ? '...' : <Send className="w-4 h-4" />}
            <span className="text-xs">
              {questionCost === 0
                ? (language === 'en' ? 'Free' : 'Gratuit')
                : `1 ${language === 'en' ? 'Credit' : 'Crédit'}`}
            </span>
          </span>
        </Button>
      </form>

      {/* Free question hint */}
      <div className="bg-slate-950 py-1 text-center">
        <span className="text-[10px] text-slate-500">
          {language === 'en'
            ? 'First question is free. Every 5th question is free.'
            : 'Première question gratuite. Chaque 5ème question est gratuite.'}
        </span>
      </div>
    </div>
  );
};

export default OracleChat;
