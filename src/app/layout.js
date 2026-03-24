import "./globals.css";

export const metadata = {
  title: "FlipTimeline — Renovation Project Tracker",
  description:
    "Project management SaaS for real estate flippers to track renovation tasks, budgets, and timelines.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
