import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ContextProvider from "@/context";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PriVest | Confidential RWA Dividend Manager",
  description: "Privacy-preserving Real-World Asset management platform using iExec TEE technology. Built for Hack4Privacy Hackathon.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ContextProvider>
          <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
        </ContextProvider>
      </body>
    </html>
  );
}