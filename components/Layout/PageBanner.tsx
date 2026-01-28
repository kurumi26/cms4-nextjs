import { useEffect, useState } from "react";
import { PublicAlbum } from "@/services/publicPageService";

interface PageBannerProps {
  title?: string;
  subtitle?: string;
  album?: PublicAlbum | null;
}

export default function PageBanner({
  title = "Build Your Future With Us",
  subtitle = "",
  album,
}: PageBannerProps) {
  const banners = album?.banners || [];
  const [current, setCurrent] = useState(0);

  const interval =
    typeof album?.transition === "number"
      ? album.transition * 1000
      : 5000;

  useEffect(() => {
    if (!banners.length) return;

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, interval);

    return () => clearInterval(timer);
  }, [banners.length, interval]);

  // 🖼 Banner with images
  if (banners.length > 0) {
    return (
      <section
        style={{
          position: "relative",
          minHeight: 420,
          overflow: "hidden",
        }}
      >
        {/* Background Images */}
        {banners.map((banner, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${banner.image_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: index === current ? 1 : 0,
              transition: "opacity 0.9s ease-in-out",
              transform: index === current ? "scale(1)" : "scale(1.02)",
              zIndex: 0,
            }}
          />
        ))}

        {/* Gradient Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.35), rgba(0,0,0,0.55))",
            zIndex: 1,
          }}
        />

        {/* Content */}
        <div
          className="container text-center text-white"
          style={{
            position: "relative",
            zIndex: 2,
            minHeight: 420,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingTop: 40,
            paddingBottom: 40,
          }}
        >
          <h1
            className="fw-bold mb-3"
            style={{
              textShadow: "0 4px 20px rgba(0,0,0,0.6)",
            }}
          >
            {title}
          </h1>

          <p
            className="lead mb-0"
            style={{
              maxWidth: 720,
              margin: "0 auto",
              opacity: 0.95,
              textShadow: "0 2px 10px rgba(0,0,0,0.5)",
            }}
          >
            {subtitle}
          </p>
        </div>
      </section>
    );
  }

  // 🔁 Fallback (no images)
  return (
    <section
      className="text-white"
      style={{
        background:
          "linear-gradient(135deg, #0d6efd 0%, #084298 100%)",
        padding: "5rem 0",
      }}
    >
      <div className="container text-center">
        <h1 className="fw-bold mb-3">{title}</h1>
        <p
          className="lead mb-0"
          style={{ maxWidth: 680, margin: "0 auto", opacity: 0.9 }}
        >
          {subtitle}
        </p>
      </div>
    </section>
  );
}
