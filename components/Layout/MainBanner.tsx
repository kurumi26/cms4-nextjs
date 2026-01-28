import { useEffect, useState } from "react";
import { PublicAlbum } from "@/services/publicPageService";
import styles from "@/styles/mainbanner.module.css";

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
  const scriptText = banner.description?.trim() || "Welcome to";

  return (
    <>
      <section className={styles.bannerSection}>
      {/* 🖼 SLIDER STRIP */}
      <div
        className={styles.sliderStrip}
        style={{
          width: `${banners.length * 100}%`,
          transform: `translateX(-${current * (100 / banners.length)}%)`,
        }}
      >
        {banners.map((banner, index) => (
          <div
            key={index}
            className={styles.slide}
            style={{
              width: `${100 / banners.length}%`,
              backgroundImage: `url(${banner.image_url})`,
            }}
          />
        ))}
      </div>

      {/* overlay */}
      <div className={styles.overlay} />

      {/* 🧾 CONTENT (STATIC) */}
      <div className={`container text-center text-white ${styles.content}`}>
        <div className={styles.inner}>
          <div className={styles.script}>{scriptText}</div>

          {banner.title && <h1 className={styles.title}>{banner.title}</h1>}

          {banner.button_text && banner.url && (
            <a
              href={banner.url}
              target="_blank"
              rel="noreferrer"
              className={styles.cta}
            >
              {banner.button_text}
            </a>
          )}
        </div>
      </div>

      {/* ● dots */}
      <div className={styles.dots}>
        {banners.map((_, index) => (
          <span
            key={index}
            onClick={() => setCurrent(index)}
            className={`${styles.dot} ${index === current ? ' ' + styles.active : ''}`}
          />
        ))}
      </div>
    </section>
    </>
  );
}
