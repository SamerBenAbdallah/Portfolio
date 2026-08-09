import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const image = `${protocol}://${host}/og-v2.png`;

  return {
    title: "Player 01 — Graphic & Motion Designer",
    description: "An interactive arcade-inspired graphic and motion design portfolio.",
    icons: { icon: "/favicon.svg" },
    openGraph: {
      title: "Player 01 — Portfolio",
      description: "Graphic & Motion Designer. Press start to enter Level 01.",
      images: [{ url: image, width: 1672, height: 941, alt: "Player 01 cinematic arcade portfolio" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Player 01 — Portfolio",
      description: "Graphic & Motion Designer. Press start to enter Level 01.",
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
