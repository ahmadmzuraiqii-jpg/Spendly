import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeInit } from "@/components/theme-init";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Spendly",
    template: "%s · Spendly",
  },
  description:
    "A simple, private, local-first personal finance dashboard for income, expenses, and spending habits.",
  applicationName: "Spendly",
};

const themeScript = `(function(){try{var t=localStorage.getItem("spendly-theme");var d=t==="dark";var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        {/*
          Applies the persisted theme before first paint to avoid a flash of
          the wrong color scheme. A raw <script> (rather than next/script)
          is deliberate: the server puts it in the initial HTML of every
          route, so it runs even on client-rendered responses such as the
          dynamic not-found page, where next/script's beforeInteractive
          payload stays in the RSC flight data and never executes. React's
          "script tag while rendering" message in dev for those pages is
          development-only and harmless: the server copy already ran.
        */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        <ThemeInit />
        {children}
      </body>
    </html>
  );
}
