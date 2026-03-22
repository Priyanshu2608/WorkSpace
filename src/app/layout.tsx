import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/shared/Toast";

export const metadata: Metadata = {
  title: "WorkSpace — Personal Project Management",
  description: "A premium personal project management tool combining Notion-style projects, GitHub integration, and Excalidraw wireframing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface text-on-surface antialiased">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
