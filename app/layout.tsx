import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Absolute Spy — TMA",
  description: "Найкращий спай-сервіс у твоєму Telegram",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <head>
        <Script 
          src="https://telegram.org/js/telegram-web-app.js" 
          strategy="beforeInteractive" 
        />
      </head>
      {/* ЗМІНИВ bg-black на bg-[#f0f2f5] і text-white на text-gray-900 */}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#f0f2f5] text-gray-900`}>
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}