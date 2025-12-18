import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { GoogleGenAI } from "@google/genai";
import { Bot, Send, User, Loader2, RefreshCw, BrainCircuit } from 'lucide-react';
import { formatCurrency } from '../constants';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const Advisor: React.FC = () => {
  const { transactions, settings, budget } = useFinance();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        // تهيئة الـ AI باستخدام المفتاح من البيئة مباشرة
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const balance = totalIncome - totalExpense;

        const context = `
          السياق المالي الحالي للمستخدم:
          - الرصيد: ${formatCurrency(balance, settings.currency)}
          - الدخل: ${formatCurrency(totalIncome, settings.currency)}
          - المصروفات: ${formatCurrency(totalExpense, settings.currency)}
          - العملة: ${settings.currency}
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `${context}\n\nسؤال المستخدم: ${text}`,
          config: {
            systemInstruction: 'أنت مستشار مالي محترف. قدم نصائح مالية دقيقة وودودة باللغة العربية بناءً على بيانات المستخدم المالية لمساعدته في إدارة أمواله بشكل أفضل. كن مختصراً وواضحاً.',
          }
        });

        const reply: Message = { 
          id: (Date.now() + 1).toString(), 
          role: 'model', 
          text: response.text || "عذراً، لم أستطع تحليل الطلب حالياً." 
        };
        
        setMessages(prev => [...prev, reply]);
    } catch (error: any) {
        console.error("Advisor Error:", error);
        setMessages(prev => [...prev, { 
            id: Date.now().toString(), 
            role: 'model', 
            text: "عذراً، واجهت مشكلة في الاتصال بالذكاء الاصطناعي. تأكد من أن حسابك مفعل بشكل صحيح." 
        }]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl border dark:border-gray-700 overflow-hidden animate-fadeIn">
        <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-white/5 backdrop-blur-md">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary-100 dark:bg-primary-900/30 rounded-xl shadow-inner">
                    <Bot className="text-primary-600" size={22} />
                </div>
                <div>
                    <h3 className="font-bold dark:text-white leading-none">المستشار المالي الذكي</h3>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase font-black tracking-widest">Powered by Gemini AI</p>
                </div>
            </div>
            <button 
              onClick={() => setMessages([])} 
              className="p-2.5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-100 dark:bg-gray-700 rounded-xl"
            >
              <RefreshCw size={18} />
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30 dark:bg-gray-900/50 custom-scrollbar">
            {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                    <div className="p-8 bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm mb-6">
                        <BrainCircuit size={80} className="text-primary-500" />
                    </div>
                    <p className="font-black text-xl text-gray-900 dark:text-white">كيف يمكنني مساعدتك في أمورك المالية؟</p>
                    <p className="text-sm mt-3 max-w-xs text-center leading-relaxed">اسألني عن ميزانيتك، أو اطلب نصيحة للتوفير، أو استفسر عن وضع ديونك.</p>
                </div>
            )}
            
            {messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.3s_ease-out]`}>
                    <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${m.role === 'user' ? 'bg-gray-900 text-white' : 'bg-primary-600 text-white'}`}>
                            {m.role === 'user' ? <User size={18} /> : <Bot size={20} />}
                        </div>
                        <div className={`p-5 rounded-3xl text-sm leading-relaxed shadow-sm ${
                            m.role === 'user' 
                            ? 'bg-primary-600 text-white rounded-tr-none' 
                            : 'bg-white dark:bg-gray-700 dark:text-white border border-gray-100 dark:border-gray-600 rounded-tl-none'
                        }`}>
                            {m.text}
                        </div>
                    </div>
                </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-pulse">
                <div className="flex gap-3 max-w-[80%]">
                    <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shrink-0 shadow-md">
                        <Bot size={20} />
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-5 rounded-3xl rounded-tl-none shadow-sm border border-gray-100 dark:border-gray-600">
                        <Loader2 className="animate-spin text-primary-500" size={20} />
                    </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
            <div className="flex gap-3 max-w-4xl mx-auto">
                <input 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && sendMessage(input)} 
                  className="flex-1 p-5 rounded-[1.5rem] bg-gray-100 dark:bg-gray-700 dark:text-white outline-none border border-transparent focus:border-primary-500 transition-all text-sm shadow-inner" 
                  placeholder="اسأل المستشار عن وضعك المالي..." 
                  disabled={isLoading}
                />
                <button 
                  onClick={() => sendMessage(input)} 
                  disabled={!input.trim() || isLoading}
                  className="p-5 bg-primary-600 text-white rounded-[1.5rem] shadow-xl shadow-primary-500/20 hover:bg-primary-700 active:scale-95 disabled:opacity-50 transition-all"
                >
                  <Send size={24} />
                </button>
            </div>
        </div>
    </div>
  );
};

export default Advisor;