import { useEffect, useState } from "react";
import { PublicAlbum } from "@/services/publicPageService";
import styles from "@/styles/mainbanner.module.css";

interface MainBannerProps {
  album: PublicAlbum;
}

export default function MainBanner({ album }: MainBannerProps) {
  const banners = album.banners || [];
  const [current, setCurrent] = useState(0);
  const [fontOverrides, setFontOverrides] = useState<Record<string, any>>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("cms4.homeBanner.fonts.v1");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        setFontOverrides(parsed as Record<string, any>);
      }
    } catch {
      // ignore
    }
  }, []);

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

  const overrideById = (banner as any)?.id ? fontOverrides[`id:${(banner as any).id}`] : undefined;
  const overrideByOrder = typeof (banner as any)?.order !== "undefined" ? fontOverrides[`order:${(banner as any).order}`] : undefined;
  const override = overrideById || overrideByOrder;

  const descriptionFont =
    (banner as any).description_font ??
    (banner as any).descriptionFont ??
    (banner as any).description_font_family ??
    (banner as any).descriptionFontFamily ??
    override?.description_font;
  const titleFont =
    (banner as any).title_font ??
    (banner as any).titleFont ??
    (banner as any).title_font_family ??
    (banner as any).titleFontFamily ??
    override?.title_font;
  const buttonFont =
    (banner as any).button_font ??
    (banner as any).buttonFont ??
    (banner as any).button_font_family ??
    (banner as any).buttonFontFamily ??
    override?.button_font;

  const titleFontSizeRaw =
    (banner as any).title_font_size ??
    (banner as any).titleFontSize ??
    (banner as any).title_size ??
    (banner as any).titleSize ??
    override?.title_font_size;
  const titleFontSize =
    typeof titleFontSizeRaw === "number"
      ? titleFontSizeRaw
      : typeof titleFontSizeRaw === "string" && titleFontSizeRaw.trim() !== ""
        ? Number(titleFontSizeRaw)
        : undefined;

  const titleBoldRaw =
    (banner as any).title_bold ??
    (banner as any).titleBold ??
    (banner as any).is_title_bold ??
    (banner as any).isTitleBold ??
    override?.title_bold;
  const titleBold =
    typeof titleBoldRaw === "boolean"
      ? titleBoldRaw
      : titleBoldRaw === 1 || titleBoldRaw === "1" || titleBoldRaw === "true"
        ? true
        : titleBoldRaw === 0 || titleBoldRaw === "0" || titleBoldRaw === "false"
          ? false
          : undefined;

  const descriptionFontSizeRaw =
    (banner as any).description_font_size ??
    (banner as any).descriptionFontSize ??
    (banner as any).description_size ??
    (banner as any).descriptionSize ??
    override?.description_font_size;
  const descriptionFontSize =
    typeof descriptionFontSizeRaw === "number"
      ? descriptionFontSizeRaw
      : typeof descriptionFontSizeRaw === "string" && descriptionFontSizeRaw.trim() !== ""
        ? Number(descriptionFontSizeRaw)
        : undefined;

  const descriptionBoldRaw =
    (banner as any).description_bold ??
    (banner as any).descriptionBold ??
    (banner as any).is_description_bold ??
    (banner as any).isDescriptionBold ??
    override?.description_bold;
  const descriptionBold =
    typeof descriptionBoldRaw === "boolean"
      ? descriptionBoldRaw
      : descriptionBoldRaw === 1 || descriptionBoldRaw === "1" || descriptionBoldRaw === "true"
        ? true
        : descriptionBoldRaw === 0 || descriptionBoldRaw === "0" || descriptionBoldRaw === "false"
          ? false
          : undefined;

  const buttonFontSizeRaw =
    (banner as any).button_font_size ??
    (banner as any).buttonFontSize ??
    (banner as any).button_size ??
    (banner as any).buttonSize ??
    override?.button_font_size;
  const buttonFontSize =
    typeof buttonFontSizeRaw === "number"
      ? buttonFontSizeRaw
      : typeof buttonFontSizeRaw === "string" && buttonFontSizeRaw.trim() !== ""
        ? Number(buttonFontSizeRaw)
        : undefined;

  const buttonBoldRaw =
    (banner as any).button_bold ??
    (banner as any).buttonBold ??
    (banner as any).is_button_bold ??
    (banner as any).isButtonBold ??
    override?.button_bold;
  const buttonBold =
    typeof buttonBoldRaw === "boolean"
      ? buttonBoldRaw
      : buttonBoldRaw === 1 || buttonBoldRaw === "1" || buttonBoldRaw === "true"
        ? true
        : buttonBoldRaw === 0 || buttonBoldRaw === "0" || buttonBoldRaw === "false"
          ? false
          : undefined;

  const scriptStyle =
    descriptionFont || typeof descriptionFontSize === "number" || typeof descriptionBold === "boolean"
      ? ({
          ...(descriptionFont ? { fontFamily: descriptionFont } : {}),
          ...(typeof descriptionFontSize === "number" && Number.isFinite(descriptionFontSize)
            ? { fontSize: Math.max(10, Math.min(120, descriptionFontSize)) }
            : {}),
          ...(typeof descriptionBold === "boolean" ? { fontWeight: descriptionBold ? 700 : 400 } : {}),
        } as const)
      : undefined;
  const titleStyle = titleFont
    ? ({
        fontFamily: titleFont,
        ...(typeof titleFontSize === "number" && Number.isFinite(titleFontSize)
          ? { fontSize: Math.max(10, Math.min(120, titleFontSize)) }
          : {}),
        ...(typeof titleBold === "boolean" ? { fontWeight: titleBold ? 900 : 400 } : {}),
      } as const)
    : (
        typeof titleFontSize === "number" || typeof titleBold === "boolean"
          ? ({
              ...(typeof titleFontSize === "number" && Number.isFinite(titleFontSize)
                ? { fontSize: Math.max(10, Math.min(120, titleFontSize)) }
                : {}),
              ...(typeof titleBold === "boolean" ? { fontWeight: titleBold ? 900 : 400 } : {}),
            } as const)
          : undefined
      );
  const buttonStyle =
    buttonFont || typeof buttonFontSize === "number" || typeof buttonBold === "boolean"
      ? ({
          ...(buttonFont ? { fontFamily: buttonFont } : {}),
          ...(typeof buttonFontSize === "number" && Number.isFinite(buttonFontSize)
            ? { fontSize: Math.max(10, Math.min(120, buttonFontSize)) }
            : {}),
          ...(typeof buttonBold === "boolean" ? { fontWeight: buttonBold ? 800 : 400 } : {}),
        } as const)
      : undefined;

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
          <div className={styles.script} style={scriptStyle}>
            {scriptText}
          </div>

          {banner.title && (
            <h1 className={styles.title} style={titleStyle}>
              {banner.title}
            </h1>
          )}

          {banner.button_text && banner.url && (
            <a
              href={banner.url}
              target="_blank"
              rel="noreferrer"
              className={styles.cta}
              style={buttonStyle}
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
