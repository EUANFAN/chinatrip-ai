import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChinaTrip AI - AI Travel Guide for China",
  description:
    "Ask practical questions about China travel, payments, transport, apps, food, and local tips.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
