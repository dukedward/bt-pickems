import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }) {
  return <TabsPrimitive.List className={cn("inline-flex h-11 items-center rounded-xl bg-[var(--muted)] p-1", className)} {...props} />;
}

export function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn("inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm data-[state=active]:bg-[var(--card)] data-[state=active]:shadow-sm", className)}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }) {
  return <TabsPrimitive.Content className={cn("mt-6 outline-none", className)} {...props} />;
}
