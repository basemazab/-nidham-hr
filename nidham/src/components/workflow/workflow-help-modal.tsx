"use client";

import { useState } from "react";
import { X, HelpCircle, Zap, Filter, Bell, UserCheck, Globe, Database, Plus, Mail } from "lucide-react";

export function WorkflowHelpModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100 transition"
        title="دليل الأتمتة"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        دليل سريع
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed inset-4 z-50 m-auto overflow-y-auto max-w-2xl rounded-2xl bg-white p-6 shadow-2xl" dir="rtl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">دليل إنشاء قواعد الأتمتة</h2>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 text-sm text-slate-600">
              <Section icon={<Zap className="h-4 w-4" />} title="١. اختيار المشغل (Trigger)">
                <p>المشغل هو الحدث اللي بيبدأ تشغيل القاعدة. اختار الحدث المناسب من القائمة:</p>
                <ul className="mt-2 space-y-1.5 pr-4">
                  <li><strong>تسجيل حضور جديد</strong> — لما الموظف يسجل حضور أو انصراف</li>
                  <li><strong>طلب إجازة جديد</strong> — لما موظف يقدم طلب إجازة</li>
                  <li><strong>إضافة موظف جديد</strong> — لما يتم إضافة موظف جديد للنظام</li>
                  <li><strong>تحديث بيانات موظف</strong> — لما يتغير بيانات موظف</li>
                  <li><strong>اعتماد مرتبات</strong> — لما يتم اعتماد دورة مرتبات</li>
                  <li><strong>Webhook خارجي</strong> — لأتمتة متقدمة باستخدام API خارجي</li>
                </ul>
              </Section>

              <Section icon={<Filter className="h-4 w-4" />} title="٢. إضافة الشروط (اختياري)">
                <p>الشروط تحدد متى يتم تشغيل القاعدة بالضبط. لو مفيش شروط، القاعدة هتشتغل كل مرة.</p>
                <p className="mt-2">مثال: لو عايز تعمل تحذير تأخير فقط لو التأخير أكتر من ١٥ دقيقة:</p>
                <div className="mt-1 rounded-lg bg-slate-50 p-2 text-xs font-mono">
                  الحقل: <strong>tardiness_minutes</strong> | أكبر من | <strong>15</strong>
                </div>
              </Section>

              <Section icon={<Bell className="h-4 w-4" />} title="٣. اختيار الإجراء (Action)">
                <p>الإجراء هو اللي هيحصل لما تتحقق الشروط. اختار من:</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <ActionCard icon={Bell} label="إرسال إشعار" desc="إشعار جوه التطبيق للموظف أو المشرف" />
                  <ActionCard icon={Mail} label="إرسال بريد" desc="رسالة إيميل للموظف أو الـ HR" />
                  <ActionCard icon={UserCheck} label="تغيير حالة موظف" desc="تحديث حالة الموظف (نشط/غير نشط)" />
                  <ActionCard icon={Globe} label="Webhook" desc="نداء URL خارجي (متقدم)" />
                  <ActionCard icon={Database} label="تحديث سجل" desc="تعديل بيانات في قاعدة البيانات" />
                  <ActionCard icon={Plus} label="إنشاء سجل" desc="إضافة سجل جديد في جدول" />
                </div>
              </Section>

              <Section icon={<HelpCircle className="h-4 w-4" />} title="٤. أفكار لأتمتة مفيدة">
                <div className="mt-2 space-y-2">
                  <Example
                    title="تحذير تأخير الموظف"
                    trigger="تسجيل حضور جديد"
                    condition="tardiness_minutes أكبر من 15"
                    action="إرسال إشعار للموظف"
                  />
                  <Example
                    title="إيقاف موظف استقال"
                    trigger="تحديث حالة موظف"
                    action="تغيير حالة الموظف لـ غير نشط"
                  />
                  <Example
                    title="تهنئة بعيد ميلاد"
                    trigger="جدول زمني (يومي)"
                    action="إرسال إشعار تهنئة"
                  />
                  <Example
                    title="تذكير بنهاية العقد"
                    trigger="جدول زمني (شهري)"
                    condition="تاريخ انتهاء العقد = الشهر الجاي"
                    action="إشعار لإدارة الموارد البشرية"
                  />
                  <Example
                    title="إشعار بزيادة الغياب"
                    trigger="تسجيل حضور"
                    condition="absent_days أكثر من 3 (في الشهر)"
                    action="إشعار للمشرف + HR"
                  />
                </div>
              </Section>

              <div className="rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 p-4 text-xs text-slate-600 border border-cyan-100">
                <strong className="text-cyan-700">💡 نصيحة:</strong> ابدأ بأتمتة بسيطة الأولى، وبعد ما تختبرها و تشتغل صح، زود الشروط والإجراءات. دايمًا اختبر القاعدة وهي في وضع "متوقف" قبل تفعيلها.
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="flex items-center gap-2 font-bold text-slate-700 mb-1.5">
        {icon}
        {title}
      </h3>
      <div className="pr-6">{children}</div>
    </div>
  );
}

function ActionCard({ icon: Icon, label, desc }: { icon: any; label: string; desc: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5">
      <div className="flex items-center gap-1.5 font-medium text-slate-700">
        <Icon className="h-3.5 w-3.5 text-cyan-600" />
        {label}
      </div>
      <p className="mt-0.5 text-[11px] text-slate-500">{desc}</p>
    </div>
  );
}

function Example({ title, trigger, condition, action }: { title: string; trigger: string; condition?: string; action: string }) {
  return (
    <div className="rounded-lg border border-slate-100 p-3">
      <p className="font-bold text-slate-700 mb-1">{title}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>◉ المشغل: <strong className="text-slate-600">{trigger}</strong></span>
        {condition && <span>◇ الشرط: <strong className="text-slate-600">{condition}</strong></span>}
        <span>▷ الإجراء: <strong className="text-slate-600">{action}</strong></span>
      </div>
    </div>
  );
}
