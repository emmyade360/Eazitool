import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eazitool - Supercharge Your Workflow",
  description: "All-in-one productivity platform that helps you get more done, faster",
  verification: {
    google: "lE62NxiyAmI2du37leik-AOKYf0G6ECuSPliD2evG1M",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-white">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 pt-16 md:ml-64">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}