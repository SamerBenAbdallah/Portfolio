import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { getSiteSettings } from "./lib/settings/repository";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, requestHeaders] = await Promise.all([getSiteSettings(), headers()]);
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const metadataBase = new URL(`${protocol}://${host}`);
  const image = settings.branding.socialImageUrl;

  return {
    title: settings.branding.siteTitle,
    description: settings.branding.metaDescription,
    metadataBase,
    icons: { icon: settings.branding.faviconUrl },
    openGraph: {
      title: settings.branding.siteTitle,
      description: settings.branding.metaDescription,
      images: image ? [{ url: image, alt: settings.branding.siteTitle }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: settings.branding.siteTitle,
      description: settings.branding.metaDescription,
      images: image ? [image] : undefined,
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
