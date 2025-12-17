import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { GoogleGenAI } from "@google/genai";
import { Bot, Send, User, Loader2, Zap, ShieldCheck, TrendingUp, RefreshCw, BrainCircuit } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

const Advisor: React.FC = () => {
  const { transactions, budget, goals, people, settings } = useFinance();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const getFinancialContext = () => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const budgetDistribution = budget.segments.map(seg => `${seg.name}: ${seg.ratio}%`).join('، ');
    const totalDebt = people.reduce((sum, p) => sum + p.debts.filter(d => d.status !== 'paid').reduce((dSum, d) => dSum + (d.amount - d.paidAmount), 0), 0);

    return `السياق المالي للمستخدم بالعملة (${settings.currency}): الدخل: ${totalIncome}، المصروفات: ${totalExpense}، الميزانية المستهدفة: ${budget.monthlyIncome}، توزيع الميزانية: ${budgetDistribution}، إجمالي الديون المتبقية: ${totalDebt}.`;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        const context = getFinancialContext();
        
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `${context}\n\nسؤال المستخدم: ${text}`,
          config: {
            systemInstruction: 'أنت "المستشار الذكي"، خبير مالي عربي. قدم نصائح عملية ومختصرة بناءً على البيانات المالية للمستخدم.',
          }
        });

        const reply = response.text || 'لم أتمكن من العثور على إجابة مناسبة حالياً.';
        
        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: reply,
            timestamp: new Date()
        }]);

    } catch (error: any) {
        console.error("AI Advisor Error:", error);
        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: 'عذراً، حدث خطأ أثناء الاتصال بالمستشار الذكي. تأكد من إعداد مفتاح API بشكل صحيح.',
            timestamp: new Date()
        }]);
    } finally {
        setIsLoading(false);
    }
  };

  const suggestions = [
    { icon: <Zap className="w-4 h-4 text-yellow-500" />, title: "تحليل سريع", prompt: "حلل وضعي المالي الحالي باختصار." },
    { icon: <TrendingUp className="w-4 h-4 text-emerald-500" />, title: "نصيحة توفير", prompt: "كيف يمكنني تقليل مصروفاتي؟" },
    { icon: <ShieldCheck className="w-4 h-4 text-blue-500" />, title: "تقييم الميزانية", prompt: "هل توزيع ميزانيتي الحالي صحيح؟" },
  ];

  return (
    <div className="flex flex-col h-[80vh] lg:h-[calc(100vh-8rem)] max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden relative">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center shrink-0">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white">
                     <Bot size={20} />
                 </div>
                 <div>
                     <h3 className="font-bold text-gray-900 dark:text-white text-sm">المستشار الذكي</h3>
                     <span className="text-[10px] text-emerald-500 flex items-center gap-1">● نشط</span>
                 </div>
             </div>
             <button onClick={() => setMessages([])} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" title="مسح المحادثة">
                 <RefreshCw size={18} />
             </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/50 dark:bg-gray-900/50">
            {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-4">
                    <BrainCircuit size={48} className="text-primary-500 opacity-20 mb-4" />
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center">مرحباً! كيف يمكنني مساعدتك في إدارة أموالك اليوم؟</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg mt-6">
                        {suggestions.map((s, i) => (
                            <button key={i} onClick={() => sendMessage(s.prompt)} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-primary-500 transition-all text-right shadow-sm">
                                {s.icon}
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{s.title}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-gray-800 text-white' : 'bg-primary-600 text-white'}`}>
                                 {msg.role === 'user' ? <User size={14} /> : <Bot size={16} />}
                             </div>
                             <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm' : 'bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-900/30 text-gray-800 dark:text-gray-200'}`}>
                                 {msg.text}
                             </div>
                        </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                           <Bot size={16} />
                        </div>
                        <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-2xl">
                          <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            )}
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
             <div className="relative flex items-center max-w-4xl mx-auto">
                 <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isLoading && sendMessage(input)}
                    placeholder="اسأل المستشار المالي..."
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white transition-all shadow-inner"
                    disabled={isLoading}
                 />
                 <button 
                    onClick={() => sendMessage(input)} 
                    disabled={!input.trim() || isLoading} 
                    className="absolute left-2 p-2.5 bg-primary-600 text-white rounded-xl disabled:opacity-30 transition-all hover:bg-primary-700 active:scale-95 shadow-lg shadow-primary-500/20"
                 >
                    <Send size={18} />
                 </button>
             </div>
        </div>
    </div>
  );
};

export default Advisor;