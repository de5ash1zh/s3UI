import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import {
  ClerkProvider,
  SignedOut,
  SignInButton,
  SignedIn,
  SignIn,
} from "@clerk/nextjs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "S3UI - Simple S3 File Manager",
  description: "A modern, user-friendly interface for managing your AWS S3 bucket files and folders",
  authors: [{ name: "S3UI Team" }],
  keywords: ["AWS", "S3", "file manager", "cloud storage", "file explorer"],
  viewport: "width=device-width, initial-scale=1",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black min-h-screen`}
        >
          <div className="bg-zinc-950 min-h-screen">
            <SignedOut>
              <div className="min-h-screen min-w-screen flex items-center justify-center">
                <SignIn routing="hash" />
              </div>
            </SignedOut>
            <SignedIn>{children}</SignedIn>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
