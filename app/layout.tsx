import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ToDo アプリ",
  description: "シンプルなToDo管理アプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-stone-50 min-h-screen">{children}</body>
    </html>
  );
}
