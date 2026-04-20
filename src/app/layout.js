import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

export const metadata = {
  title: "FlipTimeline — Renovation Project Tracker",
  description:
    "Project management SaaS for real estate flippers to track renovation tasks, budgets, and timelines.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}<Analytics /></body>
    </html>
  );
}
