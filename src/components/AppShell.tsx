import { BottomNav } from "@/components/BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <div className="mx-auto min-h-dvh w-full max-w-3xl border-x border-line/60 bg-canvas/82 shadow-soft backdrop-blur">
        {children}
        <BottomNav />
      </div>
    </div>
  );
}
