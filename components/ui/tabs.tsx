import * as React from "react";

interface TabsProps {
  defaultValue: string;
  children: React.ReactNode;
  onValueChange?: (value: string) => void;
}

export function Tabs({ defaultValue, children, onValueChange }: TabsProps) {
  const [value, setValue] = React.useState(defaultValue);
  
  // Create a function that updates internal state and calls the external handler
  const handleValueChange = React.useCallback((newValue: string) => {
    setValue(newValue);
    if (onValueChange) {
      onValueChange(newValue);
    }
  }, [onValueChange]);
  
  return (
    <TabsContext.Provider value={{ value, setValue: handleValueChange }}>
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
  disabled?: boolean;
}
export function TabsTrigger({ value, children, disabled = false}: TabsTriggerProps) {
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
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      onClick={() => ctx.setValue(value)}
      aria-selected={isActive}
      role="tab"
      disabled={disabled}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}
export function TabsContent({ value, children, className = "" }: TabsContentProps) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("TabsContent must be used within Tabs");
  if (ctx.value !== value) return null;
  return <div className={`mt-2 ${className}`} role="tabpanel">{children}</div>;
}

const TabsContext = React.createContext<{
  value: string;
  setValue: (v: string) => void;
} | null>(null); 