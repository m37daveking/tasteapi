import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TasteAPI — Access the judgment of history's greatest minds",
  description:
    "Encode the taste of cultural icons into AI-powered APIs. Get creative judgment from Rick Rubin, Brian Eno, Steve Jobs, and more.",
  openGraph: {
    title: "TasteAPI",
    description: "Access the aesthetic judgment of history's greatest tastemakers.",
    siteName: "TasteAPI",
  },
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
