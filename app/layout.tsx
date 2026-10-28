import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL("https://www.biomedical-radar.example"),
  title: {
    default: "Biyomedikal AR-GE Konferans Radarı",
    template: "%s | Biyomedikal AR-GE Konferans Radarı",
  },
  description: "Biyomedikal AR-GE konferans, çağrı, hibe ve deadline takibi için güvenilir radar arayüzü.",
  keywords: [
    "biyomedikal konferans",
    "AR-GE çağrıları",
    "deadline takibi",
    "tıbbi konferans",
    "hibe ve çağrılar",
    "bilimsel etkinlikler",
  ],
  applicationName: "Biomedical Conference Radar",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Biyomedikal AR-GE Konferans Radarı",
    description: "Güvenilir kaynaklardan konferans, deadline ve hibe çağrılarını tek ekranda takip edin.",
    url: "/",
    siteName: "Biomedical Conference Radar",
    locale: "tr_TR",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Biomedical Conference Radar preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Biyomedikal AR-GE Konferans Radarı",
    description: "Deadline, konferans ve hibe çağrılarını tek ekranda takip eden özel radar.",
    images: ["/twitter-image"],
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  other: {
    "theme-color": "#0f172a",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">{children}</body>
    </html>
  );
}
