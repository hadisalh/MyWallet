
import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { GoogleGenAI } from "@google/genai";
import { Bot, Send, User, Loader2, RefreshCw, BrainCircuit } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const Advisor: React.FC = () => {
  const { transactions, settings } = useFinance();
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
        // محاولة الحصول على المفتاح من مصادر متعددة للأمان
        const apiKey = process.env.API_KEY || (window as any).process?.env?.API_KEY;
        
        if (!apiKey) {
            throw new Error("API_KEY_MISSING");
        }

        const ai = new GoogleGenAI({ apiKey });
        const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `سياق مالي للمستخدم (العملة: ${settings.currency}): الدخل الإجمالي ${totalIncome}، المصروف الإجمالي ${totalExpense}. سؤال المستخدم: ${text}`,
          config: {
            systemInstruction: 'أنت مستشار مالي محترف. قدم نصائح مالية دقيقة وودودة باللغة العربية بناءً على بيانات المستخدم المالية لمساعدته في إدارة أمواله بشكل أفضل.',
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
        let errorText = "حدث خطأ أثناء الاتصال بالمستشار الذكي.";
        
        if (error.message === "API_KEY_MISSING") {
          errorText = "يرجى إعداد مفتاح API الخاص بـ Gemini في إعدادات البيئة (Environment Variables) باسم API_KEY.";
        } else if (error.status === 403) {
          errorText = "مفتاح API غير صالح أو ليس لديه صلاحيات كافية.";
        }
        
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: errorText }]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-[2rem] shadow-xl border dark:border-gray-700 overflow-hidden animate-fadeIn">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-white/5 backdrop-blur-md">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                    <Bot className="text-primary-600" size={20} />
                </div>
                <h3 className="font-bold dark:text-white">المستشار المالي الذكي</h3>
            </div>
            <button 
              onClick={() => setMessages([])} 
              className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="مسح المحادثة"
            >
              <RefreshCw size={18} />
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30 dark:bg-gray-900/50 custom-scrollbar">
            {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-full shadow-inner mb-6">
                        <BrainCircuit size={64} className="text-primary-500" />
                    </div>
                    <p className="font-bold text-lg">أهلاً بك! أنا مستشارك المالي</p>
                    <p className="text-sm mt-2">يمكنك سؤالي عن ميزانيتك، كيفية التوفير، أو تحليل مصروفاتك.</p>
                </div>
            )}
            
            {messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.3s_ease-out]`}>
                    <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${m.role === 'user' ? 'bg-gray-800 text-white' : 'bg-primary-600 text-white'}`}>
                            {m.role === 'user' ? <User size={14} /> : <Bot size={16} />}
                        </div>
                        <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
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
                    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white shrink-0">
                        <Bot size={16} />
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 dark:border-gray-600">
                        <Loader2 className="animate-spin text-primary-500" size={18} />
                    </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
            <div className="flex gap-2 max-w-3xl mx-auto">
                <input 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && sendMessage(input)} 
                  className="flex-1 p-4 rounded-2xl bg-gray-100 dark:bg-gray-700 dark:text-white outline-none border border-transparent focus:border-primary-500 transition-all text-sm shadow-inner" 
                  placeholder="كيف يمكنني تحسين خطتي المالية لهذا الشهر؟" 
                  disabled={isLoading}
                />
                <button 
                  onClick={() => sendMessage(input)} 
                  disabled={!input.trim() || isLoading}
                  className="p-4 bg-primary-600 text-white rounded-2xl shadow-lg shadow-primary-500/20 hover:bg-primary-700 active:scale-95 disabled:opacity-50 transition-all"
                >
                  <Send size={20} />
                </button>
            </div>
        </div>
    </div>
  );
};

export default Advisor;
