
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Menu from "./_Menu";
import styles from "@/styles/_topbar.module.css";

export default function LandingTopbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // compute threshold: if there's a banner, stay transparent until user scrolls
    // past the banner height. Otherwise use a small default threshold.
    const bannerEl = document.querySelector('.page-banner') as HTMLElement | null;
    const threshold = bannerEl ? Math.max(20, bannerEl.offsetHeight - 40) : 20;

    const onScroll = () => {
      setScrolled(window.scrollY > threshold);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <header className={`${styles['topbar-dark']} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles['topbar-inner']}>
        <div className="left">
          <Link href="/" className={styles.brand}>
            <span className={styles['logo-box']}>
              <img src="/images/logo.png" alt="ECOHO" className={styles['logo-img']} />
            </span>

          </Link>
        </div>

        <div className={styles.right}>
          <div className={styles.socials}>
            <a
              href="https://facebook.com/"
              className={styles['social-icon']}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <i className="fab fa-facebook-f" aria-hidden="true"></i>
            </a>

            <a
              href="https://instagram.com/"
              className={styles['social-icon']}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <i className="fab fa-instagram" aria-hidden="true"></i>
            </a>

            <a
              href="https://twitter.com/"
              className={styles['social-icon']}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
            >
              <i className="fab fa-twitter" aria-hidden="true"></i>
            </a>
          </div>

          <nav className={styles['nav-wrap']}>
            <ul className={styles['nav-list']}><Menu /></ul>
          </nav>
        </div>
      </div>
    </header>
  );
}

