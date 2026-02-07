import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ContextProvider from "@/context";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Use local fallback or disable font optimization
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  fallback: ['system-ui', 'arial']
});

export const metadata: Metadata = {
  title: "PriVest | Confidential RWA Dividend Manager",
  description: "Privacy-preserving Real-World Asset management platform using iExec TEE technology. Built for Hack4Privacy Hackathon.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth tap-highlight-none">
      <head>
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.variable} font-sans antialiased no-select`}>
        <ContextProvider>
          <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
            <Header />
            <main className="flex-grow overflow-x-hidden">{children}</main>
            <Footer />
          </div>
        </ContextProvider>
      </body>
    </html>
  );
}