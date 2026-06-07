export type DashboardMode = "today" | "week";

type ModeToggleProps = {
  mode: DashboardMode;
  onModeChange: (mode: DashboardMode) => void;
};

const modes: { id: DashboardMode; label: string }[] = [
  { id: "today", label: "Heute" },
  { id: "week", label: "Woche" },
];

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-md border border-line bg-surface p-1" role="tablist" aria-label="Briefing-Modus">
      {modes.map((item) => (
        <button
          aria-selected={mode === item.id}
          className={`min-h-10 rounded px-4 text-sm font-semibold transition ${
            mode === item.id ? "bg-slate-200 text-slate-950" : "text-muted hover:bg-panel hover:text-ink"
          }`}
          key={item.id}
          onClick={() => onModeChange(item.id)}
          role="tab"
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
