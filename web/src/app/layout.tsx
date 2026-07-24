import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GuavaJobs",
    template: "%s · GuavaJobs",
  },
  description:
    "Discover, Generate, Apply and Track your job applications with GuavaJobs - the honest AI-assisted job application platform for career changers and job seekers.",
  metadataBase: new URL(getSiteUrl()),
  openGraph: {
    title: "GuavaJobs",
    description:
      "Discover, Generate, Apply and Track your job applications with GuavaJobs - the honest AI-assisted job application platform for career changers and job seekers.",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "GuavaJobs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GuavaJobs",
    description:
      "Discover, Generate, Apply and Track your job applications with GuavaJobs - the honest AI-assisted job application platform for career changers and job seekers.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-[100dvh] w-full max-w-full overflow-x-hidden antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
