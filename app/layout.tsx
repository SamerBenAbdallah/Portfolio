import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const image = `${protocol}://${host}/og-v3.png`;

  return {
    title: "Samer Ben Abdallah — Graphic & Motion Designer",
    description: "Samer Ben Abdallah's interactive arcade-inspired graphic and motion design portfolio.",
    icons: { icon: "/assets/arcade/v3/samer-mark-transparent.png" },
    openGraph: {
      title: "Samer Ben Abdallah — Portfolio",
      description: "Graphic & Motion Designer. Press start to enter the arcade.",
      images: [{ url: image, width: 1672, height: 941, alt: "Samer Ben Abdallah's cinematic arcade portfolio" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Samer Ben Abdallah — Portfolio",
      description: "Graphic & Motion Designer. Press start to enter the arcade.",
      images: [image],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
