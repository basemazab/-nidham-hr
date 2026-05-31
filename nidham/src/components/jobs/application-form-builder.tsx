"use client";

import { useState, useRef, useCallback } from "react";
import { GripVertical, Plus, Trash2, Pencil, Check, X } from "lucide-react";

export type Question = {
  id: string;
  type: "text" | "multiple_choice" | "yes_no" | "file";
  label: string;
  required: boolean;
  options?: string[];
};

type Props = {
  questions: Question[];
  onChange: (questions: Question[]) => void;
  disabled?: boolean;
};

const TYPE_LABELS: Record<Question["type"], string> = {
  text: "نص",
  multiple_choice: "اختيار من متعدد",
  yes_no: "نعم/لا",
  file: "رفع ملف",
};

let counter = 0;
function freshId() {
  counter++;
  return `q_${Date.now()}_${counter}`;
}

export function ApplicationFormBuilder({ questions, onChange, disabled }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Question | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setEditForm({ ...q });
  };

  const saveEdit = () => {
    if (!editForm) return;
    onChange(questions.map((q) => (q.id === editingId ? editForm : q)));
    setEditingId(null);
    setEditForm(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const removeQuestion = (id: string) => {
    onChange(questions.filter((q) => q.id !== id));
  };

  const addQuestion = (type: Question["type"]) => {
    const q: Question = {
      id: freshId(),
      type,
      label: "",
      required: false,
      options: type === "multiple_choice" ? [""] : undefined,
    };
    onChange([...questions, q]);
    startEdit(q);
  };

  const moveQuestion = useCallback(
    (from: number, to: number) => {
      if (to < 0 || to >= questions.length) return;
      const copy = [...questions];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      onChange(copy);
    },
    [questions, onChange],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 font-cairo">
          استمارة التقديم (أسئلة ذكية)
        </h3>
        {!disabled && questions.length > 0 && (
          <span className="text-xs text-slate-400 font-cairo">{questions.length} سؤال</span>
        )}
      </div>

      {questions.length === 0 && (
        <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <p className="text-sm text-slate-500 font-cairo mb-3">
            استخدم "توليد بالذكاء الاصطناعي" عشان يظهر الأسئلة هنا
          </p>
          <p className="text-xs text-slate-400 font-cairo">— أو أضف أسئلة يدويًا من الأسفل —</p>
        </div>
      )}

      <ul className="space-y-2">
        {questions.map((q, i) => (
          <li
            key={q.id}
            className={`bg-white rounded-lg border ${
              editingId === q.id ? "border-brand-cyan ring-2 ring-brand-cyan/10" : "border-slate-200"
            } ${dragIndex === i ? "opacity-50" : ""} transition`}
            draggable={!disabled && editingId !== q.id}
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => { e.preventDefault(); if (dragIndex !== null && dragIndex !== i) moveQuestion(dragIndex, i); }}
            onDragEnd={() => setDragIndex(null)}
          >
            {editingId === q.id && editForm ? (
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1 font-cairo">نص السؤال <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={editForm.label}
                    onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none text-sm font-cairo"
                    placeholder="اكتب السؤال..."
                    dir="rtl"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1 font-cairo">النوع</label>
                    <select
                      value={editForm.type}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value as Question["type"], options: e.target.value === "multiple_choice" ? [""] : undefined })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-cairo"
                    >
                      <option value="text">نص</option>
                      <option value="multiple_choice">اختيار من متعدد</option>
                      <option value="yes_no">نعم/لا</option>
                      <option value="file">رفع ملف</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer py-2">
                      <input
                        type="checkbox"
                        checked={editForm.required}
                        onChange={(e) => setEditForm({ ...editForm, required: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-brand-cyan focus:ring-brand-cyan"
                      />
                      <span className="text-sm text-slate-700 font-cairo">إجباري</span>
                    </label>
                  </div>
                </div>
                {editForm.type === "multiple_choice" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1 font-cairo">الخيارات</label>
                    <div className="space-y-1">
                      {(editForm.options ?? [""]).map((opt, oi) => (
                        <div key={oi} className="flex gap-1">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const opts = [...(editForm.options ?? [""])];
                              opts[oi] = e.target.value;
                              setEditForm({ ...editForm, options: opts });
                            }}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-cairo"
                            dir="rtl"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const opts = (editForm.options ?? [""]).filter((_, idx) => idx !== oi);
                              setEditForm({ ...editForm, options: opts.length ? opts : [""] });
                            }}
                            className="px-2 text-red-500 hover:bg-red-50 rounded"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, options: [...(editForm.options ?? [""]), ""] })}
                        className="text-xs text-brand-cyan-dark hover:underline font-cairo"
                      >
                        + إضافة خيار
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={saveEdit}
                    className="px-4 py-1.5 rounded-lg bg-brand-cyan-dark text-white text-sm font-bold hover:bg-brand-cyan transition font-cairo flex items-center gap-1"
                  >
                    <Check size={14} /> حفظ
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition font-cairo"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3">
                {!disabled && (
                  <button
                    type="button"
                    className="cursor-grab text-slate-300 hover:text-slate-500 transition"
                    title="اسحب لإعادة الترتيب"
                  >
                    <GripVertical size={16} />
                  </button>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800 font-cairo truncate">
                      {q.label || <span className="text-slate-400 italic">(بدون نص)</span>}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-cairo shrink-0">
                      {TYPE_LABELS[q.type]}
                    </span>
                    {q.required && <span className="text-red-500 text-xs shrink-0">*</span>}
                  </div>
                </div>
                {!disabled && (
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(q)}
                      className="p-1.5 text-slate-400 hover:text-brand-cyan-dark hover:bg-cyan-50 rounded transition"
                      title="تعديل"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeQuestion(q.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                      title="حذف"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      {!disabled && (
        <div className="flex flex-wrap gap-2 pt-2">
          <span className="text-xs text-slate-500 font-cairo self-center">إضافة سؤال:</span>
          <button
            type="button"
            onClick={() => addQuestion("text")}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition font-cairo"
          >
            + نص
          </button>
          <button
            type="button"
            onClick={() => addQuestion("multiple_choice")}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition font-cairo"
          >
            + اختيار من متعدد
          </button>
          <button
            type="button"
            onClick={() => addQuestion("yes_no")}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition font-cairo"
          >
            + نعم/لا
          </button>
          <button
            type="button"
            onClick={() => addQuestion("file")}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition font-cairo"
          >
            + رفع ملف
          </button>
        </div>
      )}
    </div>
  );
}
