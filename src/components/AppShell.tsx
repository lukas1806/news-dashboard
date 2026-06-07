import { BottomNav } from "@/components/BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <div className="mx-auto min-h-dvh w-full max-w-3xl bg-canvas pt-[env(safe-area-inset-top)]">
        {children}
        <BottomNav />
      </div>
    </div>
  );
}
