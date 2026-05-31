"use client";

import { useChat } from "@ai-sdk/react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { MessageCircle, X, Send, Loader } from "lucide-react";

/**
 * HRAIAssistant — مساعد HR ذكي عائم
 * - يساعد المديرين في الوصول السريع للمعلومات
 * - يجيب على أسئلة حول الموظفين والرواتب والإجازات
 * - يوفر تقارير سريعة
 */
export function HRAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/ai/hr-assistant",
    system: `أنت مساعد HR ذكي متخصص في نظام إدارة الموارد البشرية. 
    تساعد المديرين في:
    - الحصول على معلومات سريعة عن الموظفين
    - حساب الرواتب والتأمينات
    - إدارة الإجازات والغيابات
    - تقارير الأداء
    - الامتثال لقانون العمل المصري
    
    كن مختصراً وعملياً في الإجابات. استخدم اللغة العربية بشكل احترافي.`,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e);
  };

  return (
    <AnimatePresence>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white shadow-lg hover:shadow-xl transition-shadow"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="فتح مساعد HR"
      >
        {isOpen ? (
          <X className="w-6 h-6 m-4" />
        ) : (
          <MessageCircle className="w-6 h-6 m-4" />
        )}
      </motion.button>

      {/* Chat Window */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-24 right-6 z-40 w-96 max-h-96 bg-surface dark:bg-slate-900 rounded-2xl shadow-2xl border border-border-soft flex flex-col overflow-hidden"
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
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
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
                </motion.div>
              ))
            )}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-surface-muted dark:bg-slate-800 rounded-lg px-3 py-2 rounded-bl-none">
                  <Loader className="w-4 h-4 animate-spin text-brand-cyan" />
                </div>
              </motion.div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="border-t border-border-soft p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="اكتب سؤالك..."
              className="flex-1 rounded-lg border border-border-soft bg-surface dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-brand-cyan text-white rounded-lg p-2 hover:bg-brand-cyan-dark disabled:opacity-50 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * HRAIAssistantProvider — مزود المساعد الذكي
 * استخدم هذا في layout.tsx لإضافة المساعد إلى كل الصفحات
 */
export function HRAIAssistantProvider() {
  return <HRAIAssistant />;
}
