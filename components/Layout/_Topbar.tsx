
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Menu from "./_Menu";
import styles from "@/styles/_topbar.module.css";

export default function LandingTopbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 991) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!mobileOpen) {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      return;
    }

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const closeMobileMenu = () => setMobileOpen(false);

  return (
    <header className={`${styles['topbar-dark']} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles['topbar-inner']}>
        <div className="left">
          <Link href="/" className={styles.brand}>
            <span className={styles['logo-box']}>
              <img src="/images/logo-light.png" alt="ECOHO" className={styles['logo-img']} />
            </span>

          </Link>
        </div>

        <div className={styles.right}>
          <button
            type="button"
            className={styles["mobile-toggle"]}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="landing-topbar-nav"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span className={styles["mobile-toggle-bar"]} />
            <span className={styles["mobile-toggle-bar"]} />
            <span className={styles["mobile-toggle-bar"]} />
          </button>

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

          {mobileOpen && (
            <button
              type="button"
              className={styles.backdrop}
              aria-label="Close menu"
              onClick={closeMobileMenu}
            />
          )}

          <nav
            id="landing-topbar-nav"
            className={`${styles["nav-wrap"]} ${mobileOpen ? styles["nav-wrap-open"] : ""}`}
          >
            <ul className={styles["nav-list"]}>
              <Menu isMobile={mobileOpen} onNavigate={closeMobileMenu} />
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}

