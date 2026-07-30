import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SDLC Brain — AI-Powered SDLC Assistant",
  description:
    "AI Engineering Copilot that transforms a Statement of Work into a living software project. Assists engineers through planning, architecture, development, testing, code review, deployment, and production support.",
  keywords: [
    "SDLC",
    "AI",
    "Software Development",
    "Agile",
    "Architecture",
    "Code Review",
    "DevOps",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
        <AppShell>{children}</AppShell>
        <Toaster />
      </body>
    </html>
  );
}
