import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Readiness Assessment | Is Your Business Ready for AI?",
  description:
    "Get a free AI Readiness Assessment for your business. Discover your score, see where you stand, and get a personalized 90-day action plan.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Outfit:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
