
// FIX: Corrected React import to include useState, useEffect, and useRef, and removed leading empty lines which may have caused parsing issues.
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

  const API_KEY = process.env.API_KEY;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    if (!API_KEY || API_KEY === 'undefined') {
        const errorMessage = "عذراً سيدي، مفتاح واجهة برمجة التطبيقات (API Key) غير مُعد بشكل صحيح. يرجى مراجعة إعدادات النشر.";
        setMessages(prev => [...prev, { id: 'error', role: 'model', text: errorMessage }]);
        return;
    }

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
        let errorMessage: string;
        const errorString = error.toString();

        if (errorString.includes('PERMISSION_DENIED') || errorString.includes('403')) {
            errorMessage = "عذراً سيدي، حدث خطأ في الصلاحيات.\n\n**يرجى التحقق من التالي:**\n- صلاحية مفتاح الـ API.\n- تفعيل `Generative Language API` في حساب Google Cloud.\n- ربط حساب فوترة صالح بالمشروع.";
        } else if (errorString.includes('API key not valid')) {
            errorMessage = "عذراً سيدي، مفتاح الـ API المستخدم غير صالح. يرجى التحقق منه في إعدادات النشر على Vercel.";
        } else {
            errorMessage = "عذراً سيدي، حدث خطأ تقني غير متوقع أثناء الاتصال. أرجو المحاولة لاحقاً.";
        }
        
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
    <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-[#020617] text-slate-900 dark:text-white overflow-hidden">
      
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar relative">
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
                  {m.role === 'user' ? (
                      <div className="p-4 rounded-2xl text-sm shadow-md bg-emerald-500 text-white rounded-br-none max-w-[75%]">
                          {m.text}
                      </div>
                  ) : (
                      <div className="flex gap-3 max-w-[85%]">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg bg-emerald-500 text-white">
                              <Bot size={20} />
                          </div>
                          <div className="p-4 rounded-2xl text-sm shadow-md bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none">
                              {m.id === 'model-streaming' && m.text === '' ? (
                                  <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                                  </div>
                              ) : (
                                  <ModelResponse text={m.text} />
                              )}
                          </div>
                      </div>
                  )}
              </div>
          ))}

          <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-transparent border-t border-slate-200 dark:border-slate-800 z-10">
          <div className="flex items-center gap-3 max-w-4xl mx-auto">
              <input 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && sendMessage(input)} 
                className="flex-1 px-5 py-3 rounded-full bg-slate-100 text-slate-900 border-2 border-transparent dark:bg-slate-700 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-500 outline-none transition-all text-sm shadow-inner placeholder:text-slate-500" 
                placeholder="أرسل استفسارك..." 
                disabled={isLoading}
              />
              <button 
                onClick={() => sendMessage(input)} 
                disabled={!input.trim() || isLoading}
                className="w-12 h-12 flex-shrink-0 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
              >
                <Send size={20} />
              </button>
          </div>
      </div>
    </div>
  );
};
