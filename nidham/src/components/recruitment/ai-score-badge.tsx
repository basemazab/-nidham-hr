"use client";

export function AiScoreBadge({ score, size = 48 }: { score: number | null; size?: number }) {
  if (score === null) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-xs text-gray-300">—</span>
      </div>
    );
  }

  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center" title={`AI Score: ${score}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700" />
      </svg>
      <span className="absolute text-xs font-black font-mono" style={{ color }}>{score}</span>
    </div>
  );
}

export function AiScoreTooltip({ score, details }: { score: number | null; details?: Record<string, number> | null }) {
  if (score === null && !details) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs min-w-[160px]">
      {score !== null && (
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
          <span className="text-slate-500 font-cairo">AI Score</span>
          <span className={"font-bold font-mono " + (score >= 70 ? "text-emerald-600" : score >= 40 ? "text-amber-600" : "text-red-600")}>
            {score}%
          </span>
        </div>
      )}
      {details && Object.entries(details).map(([key, val]) => (
        <div key={key} className="flex items-center justify-between py-1">
          <span className="text-slate-500 font-cairo">{key}</span>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className={"h-full rounded-full " + (val >= 70 ? "bg-emerald-500" : val >= 40 ? "bg-amber-500" : "bg-red-500")}
                style={{ width: val + "%" }} />
            </div>
            <span className="text-slate-600 font-mono w-6 text-left">{val}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
