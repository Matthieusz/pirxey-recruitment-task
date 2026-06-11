import { cn } from "@pirxey-recruitment-task/ui/lib/utils";
import { LoaderCircle, Search, X } from "lucide-react";
import type { RefObject } from "react";
import { useEffect, useEffectEvent } from "react";

import { useIsMac } from "@/hooks/use-is-mac";

interface SearchBarProps {
  readonly inputRef: RefObject<HTMLInputElement | null>;
  readonly isSearching?: boolean;
  readonly onChange: (value: string) => void;
  readonly value: string;
}

export const SearchBar = ({
  inputRef,
  isSearching = false,
  onChange,
  value,
}: SearchBarProps) => {
  const isMac = useIsMac();

  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const isModifier = isMac ? event.metaKey : event.ctrlKey;
    const isK = event.key.toLowerCase() === "k";

    if (isModifier && isK) {
      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
      return;
    }

    if (event.key === "Escape" && document.activeElement === inputRef.current) {
      if (value !== "") {
        event.preventDefault();
        onChange("");
        return;
      }
      inputRef.current?.blur();
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <search aria-label="Search the shelf" className="block">
      <div className="relative">
        {isSearching ? (
          <LoaderCircle
            aria-hidden="true"
            className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-4 size-4 animate-spin text-ink-soft"
          />
        ) : (
          <Search
            aria-hidden="true"
            className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-4 size-4 text-ink-soft"
          />
        )}
        <input
          aria-label="Search books by title or author"
          autoComplete="off"
          className={cn(
            "h-12 w-full rounded-md border border-hairline bg-page-edge/40 pr-24 pl-11",
            "text-base text-ink placeholder:text-ink-soft",
            "transition-colors duration-150",
            "focus:bg-paper focus-visible:border-magenta-soft focus-visible:outline-none",
            "focus-visible:ring-2 focus-visible:ring-magenta-soft/30 focus-visible:ring-offset-0",
            "[&::-webkit-search-cancel-button]:appearance-none",
            "[&::-webkit-search-decoration]:appearance-none"
          )}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search by title or author"
          ref={inputRef}
          spellCheck={false}
          type="search"
          value={value}
        />
        {value === "" ? (
          <kbd
            aria-hidden="true"
            className={cn(
              "-translate-y-1/2 absolute top-1/2 right-3 flex items-center gap-1",
              "rounded-sm border border-hairline bg-paper/60 px-1.5 py-0.5",
              "font-mono text-[11px] text-ink-soft"
            )}
          >
            <span className="text-[13px] leading-none" suppressHydrationWarning>
              {isMac ? "⌘" : "Ctrl"}
            </span>
            <span className="leading-none">K</span>
          </kbd>
        ) : (
          <button
            aria-label="Clear search"
            className={cn(
              "-translate-y-1/2 absolute top-1/2 right-3 flex size-7 items-center justify-center",
              "rounded-sm text-ink-soft transition-colors",
              "hover:bg-page-edge hover:text-ink",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta-soft/40"
            )}
            onClick={handleClear}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>
    </search>
  );
};
