import { useEffect, useState } from "react";
import { PublicAlbum } from "@/services/publicPageService";

interface MainBannerProps {
  album: PublicAlbum;
}

export default function MainBanner({ album }: MainBannerProps) {
  const banners = album.banners || [];
  const [current, setCurrent] = useState(0);

  const interval =
    typeof album.transition === "number"
      ? album.transition * 1000
      : 5000;

  useEffect(() => {
    if (!banners.length) return;

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, interval);

    return () => clearInterval(timer);
  }, [banners.length, interval]);

  if (!banners.length) return null;

  const banner = banners[current];

  return (
    <section
      style={{
        position: "relative",
        minHeight: "500px",
        overflow: "hidden",
      }}
    >
      {/* 🖼 SLIDER STRIP */}
      <div
        style={{
          display: "flex",
          width: `${banners.length * 100}%`,
          height: "100%",
          transform: `translateX(-${current * (100 / banners.length)}%)`,
          transition: "transform 0.8s ease-in-out",
          position: "absolute",
          inset: 0,
        }}
      >
        {banners.map((banner, index) => (
          <div
            key={index}
            style={{
              width: `${100 / banners.length}%`,
              backgroundImage: `url(${banner.image_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
        ))}
      </div>

      {/* overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.40)",
          zIndex: 1,
        }}
      />

      {/* 🧾 CONTENT (STATIC) */}
      <div
        className="container text-center text-white"
        style={{
          position: "relative",
          zIndex: 2,
          minHeight: "500px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {banner.title && <h1 className="fw-bold mb-3">{banner.title}</h1>}
        {banner.description && (
          <p className="lead mb-4">{banner.description}</p>
        )}

        {banner.button_text && banner.url && (
          <a href={banner.url} target="_blank" className="btn btn-primary">
            {banner.button_text}
          </a>
        )}
      </div>

      {/* ● dots */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "8px",
          zIndex: 3,
        }}
      >
        {banners.map((_, index) => (
          <span
            key={index}
            onClick={() => setCurrent(index)}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor:
                index === current
                  ? "#fff"
                  : "rgba(255,255,255,0.5)",
              cursor: "pointer",
            }}
          />
        ))}
      </div>
    </section>
  );
}
