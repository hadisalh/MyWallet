
import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { GoogleGenAI } from "@google/genai";
import { Bot, Send, User, RefreshCw, Sparkles, ShieldCheck, TrendingUp, Lightbulb } from 'lucide-react';
import { formatCurrency } from '../constants';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const ModelResponse: React.FC<{ text: string }> = ({ text }) => {
    const html = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/^- (.*?)(\n|$)/gm, '<li class="ml-4 list-disc">$1</li>') // List items
        .replace(/\n/g, '<br />');

    const finalHtml = html.includes('<li>') ? `<ul>${html.replace(/<br \/>/g, '')}</ul>` : html;

    return <div dangerouslySetInnerHTML={{ __html: finalHtml }} className="whitespace-pre-wrap leading-relaxed" />;
};

export default function Advisor(): React.ReactElement {
  const { transactions, settings, budget } = useFinance();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_KEY = process.env.API_KEY || "AIzaSyBsPsybFFviXStTBBbKJHGoKnUFJF0qL9s";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMessage, { id: 'model-streaming', role: 'model', text: '' }]);
    setInput('');
    setIsLoading(true);

    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        
        const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const balance = totalIncome - totalExpense;

        const context = `
          بيانات مالية: (العملة: ${settings.currency}):
          - الرصيد: ${formatCurrency(balance, settings.currency)}
          - الدخل: ${formatCurrency(totalIncome, settings.currency)}
          - المصروفات: ${formatCurrency(totalExpense, settings.currency)}
          - الميزانية: ${budget.segments.map(s => `${s.name}: ${s.ratio}%`).join(', ')}
        `;

        const stream = await ai.models.generateContentStream({
          model: 'gemini-3-flash-preview',
          contents: `${context}\n\nطلب المستخدم: ${text}`,
          config: {
            systemInstruction: 'أنت "المستشار المالي الأعلى"، مساعد ذكاء اصطناعي فائق التطور ومُصمم لتقديم استشارات مالية حصرية لكبار الشخصيات. خاطب المستخدم دائماً بلقب "سيدي" أو "سيدتي" وبكل احترام وتقدير. يجب أن تكون إجاباتك ذات هيبة، واثقة، ومُحفّزة. استخدم لغة قوية وإيجابية. عند تقديم النصائح، قم بتنظيمها على شكل تقارير احترافية باستخدام الماركداون: ابدأ بـ **"ملخص تنفيذي"**، ثم استخدم **"النقاط الرئيسية"** على شكل قائمة، واختتم بـ **"الخطوات التالية الموصى بها"**. هدفك هو تمكين المستخدم ومنحه شعوراً بالسيطرة والقوة على مستقبله المالي.',
          }
        });

        let fullResponse = "";
        for await (const chunk of stream) {
            const chunkText = chunk.text;
            if (chunkText) {
                fullResponse += chunkText;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = fullResponse;
                    return newMessages;
                });
            }
        }
    } catch (error: any) {
        console.error("Advisor Error:", error);
        let errorMessage = "عذراً سيدي، حدث خطأ تقني أثناء الاتصال. قد يكون مفتاح الخدمة غير صالح. أرجو المحاولة لاحقاً.";
        setMessages(prev => [...prev.slice(0, -1), { id: 'error', role: 'model', text: errorMessage }]);
    } finally {
        setIsLoading(false);
    }
  };

  const suggestedPrompts = [
    { text: 'قدم لي تقريراً تنفيذياً عن وضعي المالي', icon: TrendingUp },
    { text: 'ما هي الفرص المتاحة للتحسين في ميزانيتي؟', icon: Lightbulb },
    { text: 'ضع لي استراتيجية لزيادة مدخراتي بنسبة 10%', icon: ShieldCheck },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-[#0f172a] text-slate-900 dark:text-white overflow-hidden">
      
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar relative">
          <button 
            onClick={() => setMessages([])} 
            disabled={isLoading || messages.length === 0}
            className="absolute top-6 left-6 z-20 p-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-full disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md"
            title="بدء جلسة جديدة"
          >
            <RefreshCw size={18} />
          </button>

          {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center animate-fadeIn pt-8">
                  <div className="relative mb-8 animate-float">
                      <div className="absolute inset-0 bg-primary-500/10 dark:bg-primary-500/20 blur-3xl rounded-full"></div>
                      <ShieldCheck size={80} className="text-primary-500 dark:text-primary-400 drop-shadow-lg stroke-1" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white">أهلاً بكم سيدي</h2>
                  <p className="text-base mt-3 max-w-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">أنا هنا لتقديم استشارات مالية دقيقة ومخصصة لتمكينكم من تحقيق أهدافكم بثقة وقوة.</p>

                  <div className="mt-12 w-full max-w-lg px-4">
                      <p className="text-xs font-bold text-center text-slate-400 dark:text-slate-500 mb-4 uppercase tracking-widest">كيف يمكنني خدمتكم اليوم؟</p>
                      <div className="grid grid-cols-1 gap-3">
                          {suggestedPrompts.map((prompt, i) => {
                              const Icon = prompt.icon;
                              return (
                                  <button 
                                      key={i} 
                                      onClick={() => sendMessage(prompt.text)}
                                      className="group text-right p-4 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white active:scale-95 flex items-center justify-between"
                                  >
                                      <span>{prompt.text}</span>
                                      <Icon className="text-slate-400 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors" size={20}/>
                                  </button>
                              )
                          })}
                      </div>
                  </div>
              </div>
          )}
          
          {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.3s_ease-out]`}>
                  <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${m.role === 'user' ? 'bg-slate-700 text-white' : 'bg-gradient-to-br from-primary-500 to-primary-700 text-white'}`}>
                          {m.role === 'user' ? <User size={18} /> : <Bot size={20} />}
                      </div>
                      <div className={`p-5 rounded-3xl text-sm shadow-md ${
                          m.role === 'user' 
                          ? 'bg-primary-600 text-white rounded-tr-none' 
                          : 'bg-white text-slate-800 border border-gray-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 rounded-tl-none'
                      }`}>
                          {m.role === 'model' ? <ModelResponse text={m.text} /> : m.text}
                          {isLoading && m.id === 'model-streaming' && m.text === '' && (
                              <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
                                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          ))}

          <div ref={messagesEndRef} />
      </div>

      <div className="p-5 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-t border-gray-200 dark:border-slate-800 z-10">
          <div className="flex gap-3 max-w-4xl mx-auto">
              <input 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && sendMessage(input)} 
                className="flex-1 px-5 py-4 rounded-[1.5rem] bg-gray-100 text-slate-900 border-2 border-gray-200 dark:bg-slate-800 dark:text-white dark:border-slate-700 focus:border-primary-500 outline-none transition-all text-sm shadow-inner placeholder:text-slate-500" 
                placeholder="أرسل استفسارك..." 
                disabled={isLoading}
              />
              <button 
                onClick={() => sendMessage(input)} 
                disabled={!input.trim() || isLoading}
                className="p-4 bg-primary-600 text-white rounded-[1.5rem] shadow-lg shadow-primary-500/20 hover:bg-primary-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send size={22} />
              </button>
          </div>
      </div>
    </div>
  );
};
