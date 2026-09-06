import * as React from "react";
import { Search, X } from "@/shared/icons";
import { cn } from "@/shared/lib/utils";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
}

export function SearchInput({
  className,
  value,
  onChange,
  onClear,
  placeholder = "搜索课程编号、名称或主讲教师...",
  ...props
}: SearchInputProps) {
  return (
    <div className={cn("relative flex items-center w-full", className)}>
      <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-input bg-background/60 pl-9 pr-8 py-2 text-sm text-foreground shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            onClear?.();
          }}
          className="absolute right-2.5 p-0.5 text-muted-foreground hover:text-foreground rounded-md transition-colors"
          aria-label="清空搜索"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
