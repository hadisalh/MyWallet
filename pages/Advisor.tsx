import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { GoogleGenAI } from "@google/genai";
import { Bot, Send, User, Loader2, Sparkles, TrendingUp, ShieldCheck, Zap, RefreshCw, BrainCircuit, MessageSquare } from 'lucide-react';

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
    const topExpenses = transactions
        .filter(t => t.type === 'expense')
        .slice(0, 5)
        .map(t => `${t.category}: ${t.amount}`)
        .join(', ');
    
    const totalDebt = people.reduce((sum, p) => sum + p.debts.filter(d => d.status !== 'paid').reduce((dSum, d) => dSum + (d.amount - d.paidAmount), 0), 0);
    
    // Dynamic mapping of budget segments for the AI context
    const budgetDistribution = budget.segments
        .map(seg => `${seg.name}: ${seg.ratio}%`)
        .join('، ');

    return `
      السياق المالي للمستخدم (العملة: ${settings.currency}):
      - إجمالي الدخل التاريخي: ${totalIncome}
      - إجمالي المصروفات التاريخية: ${totalExpense}
      - الرصيد الحالي التقديري: ${totalIncome - totalExpense}
      - أعلى المصروفات مؤخراً: ${topExpenses || 'لا يوجد'}
      - الميزانية الشهرية المستهدفة: ${budget.monthlyIncome}
      - توزيع الميزانية المستهدف: ${budgetDistribution}
      - إجمالي الديون المتبقية (عليّ و لي): ${totalDebt}
      
      دورك: أنت مستشار مالي ذكي ومحترف جداً يدعى "المستشار الذكي".
      تحدث باللغة العربية بأسلوب لبق، مشجع، ومحترف.
      حلل البيانات وقدم نصيحة مخصصة ودقيقة بناءً على الأرقام أعلاه.
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
        const modelName = 'gemini-3-flash-preview';
        const context = getFinancialContext();
        const prompt = `${context}\n\nسؤال المستخدم: ${text}`;

        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt, 
            config: {
                systemInstruction: "You are a helpful, professional financial advisor speaking Arabic. Use markdown for bolding important numbers and structure. Be encouraging but realistic.",
            }
        });

        const reply = response.text;

        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: reply || 'عذراً، لم أتمكن من صياغة إجابة مناسبة.',
            timestamp: new Date()
        }]);

    } catch (error) {
        console.error("AI Error:", error);
        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: 'عذراً، واجهت مشكلة في الاتصال. يرجى المحاولة لاحقاً والتأكد من توفر مفتاح API صالح.',
            timestamp: new Date()
        }]);
    } finally {
        setIsLoading(false);
    }
  };

  const suggestions = [
    { 
        icon: <Zap className="w-4 h-4 text-yellow-500" />, 
        title: "تحليل سريع", 
        prompt: "قم بتحليل وضعي المالي الحالي بشكل شامل بناءً على بياناتي." 
    },
    { 
        icon: <TrendingUp className="w-4 h-4 text-emerald-500" />, 
        title: "نصيحة توفير", 
        prompt: "بناءً على مصروفاتي، كيف يمكنني تقليل الإنفاق والادخار بشكل أفضل؟" 
    },
    { 
        icon: <ShieldCheck className="w-4 h-4 text-blue-500" />, 
        title: "تقييم الميزانية", 
        prompt: "هل توزيع ميزانيتي الحالي (50-30-20 أو غيره) مناسب لظروفي؟" 
    },
  ];

  return (
    <div className="flex flex-col h-[80vh] lg:h-[calc(100vh-8rem)] max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden relative">
        
        <div className="px-6 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-700 flex justify-between items-center z-10 shrink-0">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                     <Bot size={20} />
                 </div>
                 <div>
                     <h3 className="font-bold text-gray-900 dark:text-white text-sm">المستشار الذكي</h3>
                     <p className="text-[10px] text-gray-500 flex items-center gap-1">
                         <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                         متصل الآن
                     </p>
                 </div>
             </div>
             <button 
                 onClick={() => setMessages([])} 
                 className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                 title="إعادة ضبط المحادثة"
             >
                 <RefreshCw size={18} />
             </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/50 dark:bg-[#0f172a]/50 custom-scrollbar scroll-smooth">
            {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-4">
                    <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <BrainCircuit size={40} className="text-indigo-500 opacity-50" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">مرحباً بك! أنا مستشارك المالي المعتمد على الذكاء الاصطناعي</h2>
                    <p className="text-gray-500 text-sm text-center max-w-xs mb-8">
                        يمكنني تحليل مدخلاتك المالية وتقديم خطط ادخار ذكية. اسألني أي شيء!
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg">
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => sendMessage(s.prompt)}
                                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all text-right group"
                            >
                                <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                                    {s.icon}
                                </div>
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{s.title}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-[slideUp_0.3s_ease-out]`}>
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/10 shadow-sm ${
                                 msg.role === 'user' 
                                 ? 'bg-gray-900 text-white' 
                                 : 'bg-indigo-600 text-white'
                             }`}>
                                 {msg.role === 'user' ? <User size={14} /> : <Bot size={16} />}
                             </div>
                             <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                 msg.role === 'user'
                                 ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tr-none border border-gray-100 dark:border-gray-700'
                                 : 'bg-indigo-50 dark:bg-indigo-900/20 text-gray-800 dark:text-gray-100 rounded-tl-none border border-indigo-100 dark:border-indigo-800/30'
                             }`}>
                                 {msg.role === 'model' ? (
                                    <div className="markdown-body space-y-2">
                                    {msg.text.split('\n').map((line, i) => {
                                        if (line.trim().startsWith('- ')) {
                                            return <div key={i} className="flex gap-2 items-start"><span className="text-indigo-500 mt-1.5 text-[6px] shrink-0">●</span><span>{line.replace('- ', '')}</span></div>;
                                        }
                                        const parts = line.split(/(\*\*.*?\*\*)/g);
                                        return (
                                            <p key={i} className="min-h-[1em]">
                                                {parts.map((part, j) => {
                                                    if (part.startsWith('**') && part.endsWith('**')) {
                                                        return <strong key={j} className="text-indigo-700 dark:text-indigo-300 font-bold">{part.slice(2, -2)}</strong>;
                                                    }
                                                    return part;
                                                })}
                                            </p>
                                        );
                                    })}
                                    </div>
                                 ) : msg.text}
                                 <div className={`text-[9px] mt-2 opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                     {msg.timestamp.toLocaleTimeString('ar-IQ', {hour: '2-digit', minute:'2-digit'})}
                                 </div>
                             </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-4">
                             <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                                 <Bot size={16} className="text-white" />
                             </div>
                             <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl rounded-tl-none flex items-center gap-1">
                                 <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                                 <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                                 <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                             </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            )}
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shrink-0">
             <div className="relative flex items-center">
                 <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                    placeholder="اكتب رسالتك هنا..."
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white placeholder-gray-400"
                 />
                 <button 
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || isLoading}
                    className="absolute left-2 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 >
                     {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className={input ? "ml-0.5" : ""} />}
                 </button>
             </div>
             <div className="text-center mt-2">
                 <p className="text-[10px] text-gray-400">قد يخطئ الذكاء الاصطناعي أحياناً. يُنصح دائماً بمراجعة القرارات المالية الهامة يدوياً.</p>
             </div>
        </div>
    </div>
  );
};

export default Advisor;