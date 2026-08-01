import type { MetadataRoute } from "next";
const base = process.env.NEXT_PUBLIC_SITE_URL || "https://tokenwatch-frontend.vercel.app";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/pricing", "/docs", "/login", "/register"].map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: path ? "monthly" : "weekly", priority: path ? 0.7 : 1 }));
}
