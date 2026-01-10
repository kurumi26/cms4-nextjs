import { useEffect, useState } from "react";
import { PublicAlbum } from "@/services/publicPageService";

interface PageBannerProps {
  title?: string;
  subtitle?: string;
  album?: PublicAlbum | null;
}

export default function PageBanner({
  title = "Build Your Future With Us",
  subtitle = "Cms5.",
  album,
}: PageBannerProps) {
  const banners = album?.banners || [];
  const [current, setCurrent] = useState(0);

  const interval =
    typeof album?.transition === "number"
      ? album.transition * 1000
      : 5000;

  // ✅ image fade slider
  useEffect(() => {
    if (!banners.length) return;

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, interval);

    return () => clearInterval(timer);
  }, [banners.length, interval]);

  // ✅ With images
  if (banners.length > 0) {
    return (
      <section
        style={{
          position: "relative",
          minHeight: "350px",
          overflow: "hidden",
        }}
      >
        {/* 🖼 IMAGE LAYER (FADE ONLY) */}
        {banners.map((banner, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${banner.image_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              opacity: index === current ? 1 : 0,
              transition: "opacity 0.6s ease-in-out",
              zIndex: 0,
            }}
          />
        ))}

        {/* overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.40)",
            zIndex: 1,
          }}
        />

        {/* 🧾 CONTENT (STATIC – NO FADE) */}
        <div
          className="container text-center text-white"
          style={{
            position: "relative",
            zIndex: 2,
            minHeight: "400px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <h1 className="fw-bold mb-3">{title}</h1>
          <p className="lead mb-0">{subtitle}</p>
        </div>
      </section>
    );
  }

  // 🔁 Fallback (no images)
  return (
    <section className="bg-primary text-white py-5">
      <div className="container text-center">
        <h1 className="fw-bold mb-3">{title}</h1>
        <p className="lead mb-5">{subtitle}</p>
      </div>
    </section>
  );
}
