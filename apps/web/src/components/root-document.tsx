import { Toaster } from "@pirxey-recruitment-task/ui/components/sonner";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type * as React from "react";

import { Navbar } from "@/components/navbar";
import { ThemeMeta } from "@/components/theme-meta";
import { ThemeProvider } from "@/components/theme-provider";

export const RootDocument = (): React.JSX.Element => (
  <html lang="en" suppressHydrationWarning>
    <head>
      <HeadContent />
    </head>
    <body>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        disableTransitionOnChange
        enableColorScheme
        enableSystem
      >
        <ThemeMeta />
        <div className="grid min-h-svh grid-rows-[auto_1fr] bg-paper text-ink">
          <Navbar />
          <Outlet />
        </div>
        <Toaster richColors />
        <TanStackRouterDevtools position="bottom-left" />
        <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
        <Scripts />
      </ThemeProvider>
    </body>
  </html>
);
