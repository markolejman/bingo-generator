import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Markos bingo generator",
  description: "Generate printable bingo cards as PDF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
