import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: ["SemrushBot", "AhrefsBot", "MJ12bot", "DotBot"],
        disallow: "/",
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/watchlist"],
      },
    ],
    sitemap: "https://waarkanikhetkijken.com/sitemap.xml",
  };
}
