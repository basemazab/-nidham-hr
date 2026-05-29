"use client";

import { useState, useRef, useEffect } from "react";
import AppLayout from "@/components/shared/AppLayout";
import { api } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  references?: string[];
  created_at?: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await api.ai.chat(userMsg.content, conversationId);
      if (!conversationId && res.conversation_id) {
        setConversationId(res.conversation_id);
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.answer,
        references: res.references,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setError(err.message || "حدث خطأ في إرسال الرسالة");
    } finally {
      setLoading(false);
    }
  };

  const newConversation = () => {
    setMessages([]);
    setConversationId(undefined);
    setError("");
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto h-[calc(100vh-48px)] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-primary font-heading">💬 الدردشة</h1>
          <button
            onClick={newConversation}
            className="btn-primary text-sm"
          >
            محادثة جديدة
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-sm p-4 mb-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <div className="text-5xl mb-4">🤖</div>
                <p className="text-lg">اسألني أي سؤال عن قانون العمل المصري</p>
                <p className="text-sm mt-2">مثال: ما هي مكافأة نهاية الخدمة؟</p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-br-none"
                    : "bg-gray-100 text-gray-800 rounded-bl-none"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                {msg.references && msg.references.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-300/30">
                    <p className="text-xs opacity-70 mb-1">📋 المراجع:</p>
                    {msg.references.slice(0, 3).map((ref, i) => (
                      <p key={i} className="text-xs opacity-70">• {ref}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-end">
              <div className="bg-gray-100 p-4 rounded-2xl rounded-bl-none">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center text-sm">
              ⚠️ {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="اكتب سؤالك هنا..."
            className="flex-1 input-field"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="btn-accent px-6 disabled:opacity-50"
          >
            إرسال
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
