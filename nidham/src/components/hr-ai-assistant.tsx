"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Loader } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

/**
 * HRAIAssistant — مساعد HR ذكي عائم
 * - يساعد المديرين في الوصول السريع للمعلومات
 * - يجيب على أسئلة حول الموظفين والرواتب والإجازات
 * - يوفر تقارير سريعة
 */
export function HRAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const msgEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  if (!mounted) return null;

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: userInput,
    };

    setMessages((prev) => [...prev, userMessage]);
    setUserInput("");
    setIsLoading(true);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const response = await fetch("/api/ai/hr-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.content || "عذراً، لم أتمكن من الإجابة على سؤالك.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      const errorMessage: Message = {
        role: "assistant",
        content: "حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200"
        aria-label="فتح مساعد HR"
      >
        {isOpen ? (
          <X className="w-6 h-6 m-4" />
        ) : (
          <MessageCircle className="w-6 h-6 m-4" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-40 w-96 max-h-96 bg-surface dark:bg-slate-900 rounded-2xl shadow-2xl border border-border-soft flex flex-col overflow-hidden animate-fade-in-up"
          style={{ animationDuration: "200ms" }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white p-4">
            <h3 className="font-semibold text-lg">مساعد HR الذكي</h3>
            <p className="text-xs opacity-90">اسأل عن الموظفين والرواتب والإجازات</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-foreground/50 text-sm py-8">
                <p className="mb-2">👋 مرحباً! كيف يمكنني مساعدتك؟</p>
                <p className="text-xs">اسأل عن:</p>
                <ul className="text-xs mt-2 space-y-1">
                  <li>• عدد الموظفين الحاليين</li>
                  <li>• الإجازات المتبقية</li>
                  <li>• حسابات الرواتب</li>
                  <li>• الامتثال القانوني</li>
                </ul>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in-up`}
                  style={{ animationDelay: `${idx * 50}ms`, animationDuration: "200ms" }}
                >
                  <div
                    className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-brand-cyan text-white rounded-br-none"
                        : "bg-surface-muted dark:bg-slate-800 text-foreground rounded-bl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-surface-muted dark:bg-slate-800 rounded-lg px-3 py-2 rounded-bl-none">
                  <Loader className="w-4 h-4 animate-spin text-brand-cyan" />
                </div>
              </div>
            )}
            <div ref={msgEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="border-t border-border-soft p-3 flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="اكتب سؤالك..."
              className="flex-1 rounded-lg border border-border-soft bg-surface dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !userInput.trim()}
              className="bg-brand-cyan text-white rounded-lg p-2 hover:bg-brand-cyan-dark disabled:opacity-50 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

/**
 * HRAIAssistantProvider — مزود المساعد الذكي
 * استخدم هذا في layout.tsx لإضافة المساعد إلى كل الصفحات
 */
export function HRAIAssistantProvider() {
  return <HRAIAssistant />;
}
