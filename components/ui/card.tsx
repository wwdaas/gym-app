import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-xl shadow-black/20 backdrop-blur-sm transition-colors",
        className,
      )}
    >
      {children}
    </div>
  );
}
