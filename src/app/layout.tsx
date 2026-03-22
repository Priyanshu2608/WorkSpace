import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/sidebar/Sidebar";
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
          <Sidebar />
          <main className="lg:ml-[260px] min-h-screen">
            <div className="p-6 lg:p-8 pt-16 lg:pt-8 max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
