import { Button } from "@pirxey-recruitment-task/ui/components/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      aria-label="Toggle dark mode"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      size="icon"
      variant="ghost"
    >
      <Sun className="size-4 rotate-0 scale-100 motion-safe:transition-transform dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-4 rotate-90 scale-0 motion-safe:transition-transform dark:rotate-0 dark:scale-100" />
    </Button>
  );
};
