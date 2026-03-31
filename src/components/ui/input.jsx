import { cn } from "@/lib/utils";

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-xl border bg-transparent px-4 py-2 text-sm outline-none ring-0 placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)]",
        className
      )}
      {...props}
    />
  );
}
