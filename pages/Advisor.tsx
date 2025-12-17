import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { GoogleGenAI } from "@google/genai";
import { formatCurrency } from '../constants';
import { Bot, Send, Sparkles, User, Loader2, TrendingUp, AlertCircle, Lightbulb, Wallet, Target, RefreshCw, Zap } from 'lucide-react';

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
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const getFinancialContext = () => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const topExpenses = transactions
        .filter(t => t.type === 'expense')
        .slice(0, 5)
        .map(t => `${t.category}: ${t.amount}`)
        .join(', ');
    
    const totalDebt = people.reduce((sum, p) => sum + p.debts.filter(d => d.status !== 'paid').reduce((dSum, d) => dSum + (d.amount - d.paidAmount), 0), 0);
    const debtsDetails = people.map(p => `${p.name} (${p.relationType === 'owes_me' ? 'يدين لي' : 'أدين له'}): ${p.debts.filter(d => d.status !== 'paid').length} ديون غير مدفوعة`).join(', ');

    const goalsProgress = goals.map(g => `${g.name}: ${Math.round((g.currentAmount / g.targetAmount) * 100)}%`).join(', ');

    return `
      User Financial Context (Currency: ${settings.currency}):
      - Total Income: ${totalIncome}
      - Total Expenses: ${totalExpense}
      - Balance: ${totalIncome - totalExpense}
      - Top Recent Expenses: ${topExpenses || 'None'}
      - Monthly Budget Goal: ${budget.monthlyIncome}
      - Budget Split: Needs ${budget.needsRatio}%, Wants ${budget.wantsRatio}%, Savings ${budget.savingsRatio}%
      - Total Outstanding Debt Value: ${totalDebt}
      - Debts Summary: ${debtsDetails || 'No debts'}
      - Goals Progress: ${goalsProgress || 'No active goals'}
      
      Your Role: You are a professional, sophisticated, and friendly AI financial advisor named 'الذكاء المالي'. 
      Speak Arabic fluently and professionally. Use markdown for formatting (bold, bullet points).
      Analyze the user's data. Give specific, actionable advice. If they are overspending, warn them politely but firmly. 
      Suggest ways to save based on their goals.
    `;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        text: text,
        timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = 'gemini-2.5-flash';
        const context = getFinancialContext();
        const prompt = `${context}\n\nUser Question: ${text}`;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt, 
            config: {
                systemInstruction: "You are a highly advanced financial assistant. Provide brief, high-value, easy-to-read advice in Arabic.",
            }
        });

        const reply = response.text;

        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: reply || 'عذراً، حدث خطأ في معالجة طلبك.',
            timestamp: new Date()
        }]);

    } catch (error) {
        console.error("AI Error:", error);
        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: 'عذراً، لا يمكنني الاتصال بالخادم حالياً. يرجى التأكد من اتصالك بالإنترنت.',
            timestamp: new Date()
        }]);
    } finally {
        setIsLoading(false);
        if(window.innerWidth > 768) {
            inputRef.current?.focus();
        }
    }
  };

  const suggestions = [
    { icon: <TrendingUp size={16} />, text: "كيف هو أدائي المالي هذا الشهر؟" },
    { icon: <AlertCircle size={16} />, text: "كيف أقلل مصاريفي؟" },
    { icon: <Target size={16} />, text: "خطة لسداد ديوني" },
    { icon: <Wallet size={16} />, text: "هل ميزانيتي متوازنة؟" },
  ];

  const analysisPrompt = "أرجو إجراء تحليل شامل وتلقائي لوضعي المالي الحالي (الدخل، المصروفات، الديون، الميزانية). حدد نقاط القوة والضعف وقدم لي 3 نصائح عملية للتحسين فوراً.";

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col max-w-5xl mx-auto">
       
       {/* Header Section Removed Title - Only Controls aligned right */}
       <div className="flex items-center justify-end mb-4 px-2">
         <div className="flex items-center gap-2">
            {/* Header Auto Analysis Button */}
            <button 
                onClick={() => sendMessage(analysisPrompt)}
                disabled={isLoading}
                className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50"
            >
                <Zap size={16} className="fill-yellow-400 text-yellow-400" />
                <span className="hidden sm:inline">تحليل شامل</span>
            </button>

            <button 
                onClick={() => setMessages([])}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                title="محادثة جديدة"
            >
                <RefreshCw size={20} />
            </button>
         </div>
       </div>

       {/* Chat Container */}
       <div className="flex-1 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white/50 dark:border-gray-700/50 overflow-hidden flex flex-col relative">
           
           {/* Messages Area */}
           <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
               {messages.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-center opacity-0 animate-[fadeIn_0.5s_ease-out_forwards] py-10">
                       <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/30">
                           <Bot size={48} className="text-white" />
                       </div>
                       <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">مرحباً بك في المستشار الذكي</h3>
                       <p className="text-gray-500 max-w-xs mb-8 text-sm">أنا هنا لمساعدتك في تحليل بياناتك المالية وتقديم المشورة.</p>
                       
                       {/* Empty State Auto Analysis Button (HERO) */}
                       <button 
                         onClick={() => sendMessage(analysisPrompt)}
                         className="mb-8 group relative inline-flex items-center justify-center gap-3 px-8 py-4 font-bold text-white transition-all duration-200 bg-gray-900 dark:bg-white dark:text-gray-900 rounded-2xl hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600"
                       >
                           <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-gray-200"></span>
                           <Zap size={20} className="fill-current text-yellow-400 animate-pulse" />
                           <span className="relative">بدء التحليل التلقائي</span>
                       </button>

                       <div className="flex items-center w-full max-w-md gap-4 mb-6">
                           <div className="h-[1px] bg-gray-200 dark:bg-gray-700 flex-1"></div>
                           <span className="text-xs text-gray-400 font-medium">أو اختر موضوعاً</span>
                           <div className="h-[1px] bg-gray-200 dark:bg-gray-700 flex-1"></div>
                       </div>

                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md px-4">
                           {suggestions.map((s, i) => (
                               <button 
                                key={i}
                                onClick={() => sendMessage(s.text)}
                                className="flex items-center gap-3 p-4 bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-md transition-all text-sm font-bold text-gray-700 dark:text-gray-200 text-right group"
                               >
                                   <div className="p-2 bg-gray-100 dark:bg-gray-600 rounded-lg text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                       {s.icon}
                                   </div>
                                   {s.text}
                               </button>
                           ))}
                       </div>
                   </div>
               ) : (
                   messages.map((msg) => (
                       <div key={msg.id} className={`flex items-end gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-[slideUp_0.3s_ease-out]`}>
                           {/* Avatar */}
                           <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                               msg.role === 'user' 
                               ? 'bg-gray-200 dark:bg-gray-700' 
                               : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-500/20'
                           }`}>
                               {msg.role === 'user' ? <User size={20} className="text-gray-600 dark:text-gray-300" /> : <Bot size={22} />}
                           </div>
                           
                           {/* Bubble */}
                           <div className={`max-w-[85%] sm:max-w-[75%] p-5 rounded-3xl text-sm leading-7 shadow-sm ${
                               msg.role === 'user' 
                               ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-br-none' 
                               : 'bg-white dark:bg-gray-700/80 backdrop-blur-md text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-600 rounded-bl-none'
                           }`}>
                               {msg.role === 'model' ? (
                                   <div className="markdown-body" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-600 dark:text-indigo-400">$1</strong>').replace(/- /g, '• ') }} />
                               ) : (
                                   msg.text
                               )}
                               <span className={`block text-[10px] mt-2 font-medium ${msg.role === 'user' ? 'text-gray-400' : 'text-gray-400'}`}>
                                   {msg.timestamp.toLocaleTimeString('ar-IQ', {hour: '2-digit', minute:'2-digit'})}
                               </span>
                           </div>
                       </div>
                   ))
               )}
               
               {isLoading && (
                   <div className="flex items-end gap-3 animate-pulse">
                       <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg">
                           <Bot size={22} />
                       </div>
                       <div className="bg-white dark:bg-gray-700/50 p-4 rounded-3xl rounded-bl-none border border-gray-100 dark:border-gray-600">
                           <div className="flex gap-1.5">
                               <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                               <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                               <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></div>
                           </div>
                       </div>
                   </div>
               )}
               <div ref={messagesEndRef} />
           </div>

           {/* Input Area */}
           <div className="p-4 bg-white/80 dark:bg-gray-900/80 border-t border-gray-100 dark:border-gray-700/50 backdrop-blur-md">
               <div className="relative flex items-center gap-3 max-w-4xl mx-auto">
                   <div className="flex-1 relative">
                       <input 
                        ref={inputRef}
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                        placeholder="اكتب رسالتك هنا..."
                        className="w-full bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 dark:focus:border-indigo-500 text-gray-900 dark:text-white rounded-2xl pl-4 pr-12 py-4 focus:outline-none focus:ring-0 transition-all shadow-inner"
                       />
                       <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                           <Lightbulb size={18} />
                       </div>
                   </div>
                   <button 
                    onClick={() => sendMessage(input)}
                    disabled={isLoading || !input.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white p-4 rounded-2xl shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center group"
                   >
                       {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} className="group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
                   </button>
               </div>
               <p className="text-center text-[10px] text-gray-400 mt-2">المستشار الذكي قد يرتكب أخطاء. يرجى مراجعة المعلومات المالية الهامة.</p>
           </div>
       </div>
    </div>
  );
};

export default Advisor;