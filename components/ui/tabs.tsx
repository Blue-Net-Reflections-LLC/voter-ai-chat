import * as React from "react";

interface TabsProps {
  defaultValue: string;
  children: React.ReactNode;
}

export function Tabs({ defaultValue, children }: TabsProps) {
  const [value, setValue] = React.useState(defaultValue);
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}
export function TabsList({ className = "", children }: TabsListProps) {
  return <div className={`flex gap-2 ${className}`}>{children}</div>;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
}
export function TabsTrigger({ value, children }: TabsTriggerProps) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("TabsTrigger must be used within Tabs");
  const isActive = ctx.value === value;
  return (
    <button
      type="button"
      className={`px-3 py-1 rounded-md text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
        isActive
          ? "bg-primary text-white border-primary"
          : "bg-muted text-muted-foreground border-border hover:bg-primary/10"
      }`}
      onClick={() => ctx.setValue(value)}
      aria-selected={isActive}
      role="tab"
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
}
export function TabsContent({ value, children }: TabsContentProps) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("TabsContent must be used within Tabs");
  if (ctx.value !== value) return null;
  return <div className="mt-2" role="tabpanel">{children}</div>;
}

const TabsContext = React.createContext<{
  value: string;
  setValue: (v: string) => void;
} | null>(null); 