import { useEffect, useState } from "react";
import Head from 'next/head';
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

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" rel="stylesheet" />
      </Head>

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
        {banner.title && (
          <h1 className="banner-title fw-bold mb-3">{banner.title}</h1>
        )}

        {banner.description && (
          <p className="banner-desc lead mb-4">{banner.description}</p>
        )}

        {banner.button_text && banner.url && (
          <a href={banner.url} target="_blank" className="banner-cta">
            {banner.button_text}
          </a>
        )}

        {/* styles moved to MainBanner.module.css */}
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
