import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 text-white shadow-lg shadow-fuchsia-900/40 hover:shadow-fuchsia-500/30 hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100",
  secondary:
    "bg-zinc-800/80 text-zinc-100 border border-zinc-700 hover:bg-zinc-700 disabled:opacity-40",
  danger:
    "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg shadow-rose-900/40 hover:shadow-rose-500/30 disabled:opacity-40",
  ghost:
    "text-fuchsia-400 hover:bg-fuchsia-500/10 disabled:opacity-40 disabled:hover:bg-transparent",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-all duration-150 disabled:cursor-not-allowed",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
