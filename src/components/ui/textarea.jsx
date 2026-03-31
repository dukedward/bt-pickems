import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "flex min-h-28 w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)]",
        className
      )}
      {...props}
    />
  );
}
