import { useEffect, useState } from "react";
import { PublicAlbum } from "@/services/publicPageService";

interface PageBannerProps {
  title?: string;
  subtitle?: string;
  album?: PublicAlbum | null;
}

export default function PageBanner({
  title = "Search Results",
  subtitle = "",
  album,
}: PageBannerProps) {
  const banners = album?.banners || [];
  const [current, setCurrent] = useState(0);

  const activeBanner: any = banners[current];

  const titleFont =
    activeBanner?.title_font ??
    activeBanner?.titleFont ??
    activeBanner?.title_font_family ??
    activeBanner?.titleFontFamily;
  const descriptionFont =
    activeBanner?.description_font ??
    activeBanner?.descriptionFont ??
    activeBanner?.description_font_family ??
    activeBanner?.descriptionFontFamily;

  const titleFontSizeRaw =
    activeBanner?.title_font_size ??
    activeBanner?.titleFontSize ??
    activeBanner?.title_size ??
    activeBanner?.titleSize;
  const titleFontSize =
    typeof titleFontSizeRaw === "number"
      ? titleFontSizeRaw
      : typeof titleFontSizeRaw === "string" && titleFontSizeRaw.trim() !== ""
        ? Number(titleFontSizeRaw)
        : undefined;

  const titleBoldRaw =
    activeBanner?.title_bold ??
    activeBanner?.titleBold ??
    activeBanner?.is_title_bold ??
    activeBanner?.isTitleBold;
  const titleBold =
    typeof titleBoldRaw === "boolean"
      ? titleBoldRaw
      : titleBoldRaw === 1 || titleBoldRaw === "1" || titleBoldRaw === "true"
        ? true
        : titleBoldRaw === 0 || titleBoldRaw === "0" || titleBoldRaw === "false"
          ? false
          : undefined;

  const descriptionFontSizeRaw =
    activeBanner?.description_font_size ??
    activeBanner?.descriptionFontSize ??
    activeBanner?.description_size ??
    activeBanner?.descriptionSize;
  const descriptionFontSize =
    typeof descriptionFontSizeRaw === "number"
      ? descriptionFontSizeRaw
      : typeof descriptionFontSizeRaw === "string" && descriptionFontSizeRaw.trim() !== ""
        ? Number(descriptionFontSizeRaw)
        : undefined;

  const descriptionBoldRaw =
    activeBanner?.description_bold ??
    activeBanner?.descriptionBold ??
    activeBanner?.is_description_bold ??
    activeBanner?.isDescriptionBold;
  const descriptionBold =
    typeof descriptionBoldRaw === "boolean"
      ? descriptionBoldRaw
      : descriptionBoldRaw === 1 || descriptionBoldRaw === "1" || descriptionBoldRaw === "true"
        ? true
        : descriptionBoldRaw === 0 || descriptionBoldRaw === "0" || descriptionBoldRaw === "false"
          ? false
          : undefined;

  const titleStyle =
    titleFont || typeof titleFontSize === "number" || typeof titleBold === "boolean"
      ? ({
          ...(titleFont ? { fontFamily: titleFont } : {}),
          ...(typeof titleFontSize === "number" && Number.isFinite(titleFontSize)
            ? { fontSize: Math.max(14, Math.min(120, titleFontSize)) }
            : {}),
          ...(typeof titleBold === "boolean" ? { fontWeight: titleBold ? 900 : 400 } : {}),
        } as const)
      : undefined;

  const subtitleStyle =
    descriptionFont || typeof descriptionFontSize === "number" || typeof descriptionBold === "boolean"
      ? ({
          ...(descriptionFont ? { fontFamily: descriptionFont } : {}),
          ...(typeof descriptionFontSize === "number" && Number.isFinite(descriptionFontSize)
            ? { fontSize: Math.max(10, Math.min(120, descriptionFontSize)) }
            : {}),
          ...(typeof descriptionBold === "boolean" ? { fontWeight: descriptionBold ? 700 : 400 } : {}),
        } as const)
      : undefined;

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
            className="mb-3"
            style={{
              textShadow: "0 4px 20px rgba(0,0,0,0.6)",
              ...(titleStyle || {}),
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
              ...(subtitleStyle || {}),
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
          "linear-gradient(135deg, #000000 0%, #102f5f 100%)",
      }}
    >
      <div
          className="container text-center text-white"
          style={{
            position: "relative",
            zIndex: 2,
            minHeight: 420,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
        <h1 className="fw-bold">{title}</h1>
      </div>
    </section>
  );
}
