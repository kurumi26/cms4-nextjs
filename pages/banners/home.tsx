import React, { useEffect, useState, useRef } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import { BannerForm as BaseBannerForm } from "@/schemas/banner";
import { OptionItem, getOptions } from "@/services/optionService";
import { toast } from "@/lib/toast";
import {
  getAlbum,
  createAlbum,
  updateAlbum,
} from "@/services/albumService";
import { axiosInstance } from "@/services/axios";

// Extend BannerForm to include order property
interface BannerForm extends BaseBannerForm {
  order?: number;
}

const HOME_ALBUM_ID = 1;

const HOME_BANNER_FONT_STORAGE_KEY = "cms4.homeBanner.fonts.v1";

type StoredFontEntry = {
  title_font?: string;
  title_font_size?: number;
  title_bold?: boolean;
  description_font?: string;
  description_font_size?: number;
  description_bold?: boolean;
  button_font?: string;
  button_font_size?: number;
  button_bold?: boolean;
};

const readStoredHomeBannerFonts = (): Record<string, StoredFontEntry> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(HOME_BANNER_FONT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, StoredFontEntry>;
  } catch {
    return {};
  }
};

const writeStoredHomeBannerFonts = (fonts: Record<string, StoredFontEntry>) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HOME_BANNER_FONT_STORAGE_KEY, JSON.stringify(fonts));
  } catch {
    // ignore storage quota / private mode
  }
};

const bannerFontStorageKey = (banner: BannerForm, index: number) => {
  if (banner.id) return `id:${banner.id}`;
  if (typeof banner.order === "number") return `order:${banner.order}`;
  return `index:${index}`;
};

const persistHomeBannerFonts = (nextBanners: BannerForm[]) => {
  const existing = readStoredHomeBannerFonts();
  const updated: Record<string, StoredFontEntry> = { ...existing };

  nextBanners.forEach((b, i) => {
    const key = bannerFontStorageKey(b, i);
    updated[key] = {
      title_font: b.title_font,
      title_font_size: b.title_font_size,
      title_bold: b.title_bold,
      description_font: b.description_font,
      description_font_size: b.description_font_size,
      description_bold: b.description_bold,
      button_font: b.button_font,
      button_font_size: b.button_font_size,
      button_bold: b.button_bold,
    };
  });

  writeStoredHomeBannerFonts(updated);
};

const FONT_FAMILY_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "Default", value: "" },
  { label: "Great Vibes", value: "Great Vibes, cursive" },
  { label: "Poppins", value: "Poppins, sans-serif" },
  { label: "Montserrat", value: "Montserrat, sans-serif" },
  { label: "Noto Sans", value: "Noto Sans, sans-serif" },
  { label: "Courgette", value: "Courgette, cursive" },
  {
    label: "System UI",
    value:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
];

function HomeBanner() {
  const [albumExists, setAlbumExists] = useState(true);
  const [showPublicPreview, setShowPublicPreview] = useState<boolean>(false);

  const [transitionIn, setTransitionIn] = useState("Fade In");
  const [transitionOut, setTransitionOut] = useState("Fade Out");
  const [duration, setDuration] = useState(5);
  const [banners, setBanners] = useState<BannerForm[]>([]);
  const [resizeIndex, setResizeIndex] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizedPreview, setResizedPreview] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [localPreviews, setLocalPreviews] = useState<Record<number, string>>({});
  const dragIndexRef = React.useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [cropRect, setCropRect] = useState<{x:number,y:number,w:number,h:number}>({x:0,y:0,w:0,h:0});
  const cropStartRef = useRef<{x:number,y:number} | null>(null);
  const cropDragRef = useRef<null | {
    mode: 'draw' | 'move' | 'resize';
    handle?: 'nw' | 'ne' | 'sw' | 'se';
    startX: number;
    startY: number;
    startRect: { x: number; y: number; w: number; h: number };
  }>(null);

  const [entranceOptions, setEntranceOptions] = useState<OptionItem[]>([]);
  const [exitOptions, setExitOptions] = useState<OptionItem[]>([]);

  const toProxiedImageUrl = (rawUrl: string) => {
    // If it's already a local/proxied URL, keep it.
    if (!rawUrl) return rawUrl;
    if (rawUrl.startsWith("/")) return rawUrl;
    if (rawUrl.startsWith("blob:") || rawUrl.startsWith("data:")) return rawUrl;
    // Remote URL: proxy through Next.js to avoid CORS issues.
    return `/api/image-proxy?url=${encodeURIComponent(rawUrl)}`;
  };


  useEffect(() => {
    loadAlbum();
  }, []);

  useEffect(() => {
    getOptions({ type: "animation", field_type: "entrance" })
      .then((res: any) => setEntranceOptions(res.data.data));

    getOptions({ type: "animation", field_type: "exit" })
      .then((res: any) => setExitOptions(res.data.data));
  }, []);


  const loadAlbum = async () => {
    try {
      const res = await getAlbum(HOME_ALBUM_ID);
      const album = res.data;

      const storedFonts = readStoredHomeBannerFonts();

      setTransitionIn(album.transition_in);
      setTransitionOut(album.transition_out);
      setDuration(album.transition);

      setBanners(
        album.banners.map((b: any, i: number) => {
          const rawServerUrl = `${process.env.NEXT_PUBLIC_API_URL}/storage/${b.image_path}`;
          const serverPreview = toProxiedImageUrl(rawServerUrl);

          const keyById = b?.id ? `id:${b.id}` : undefined;
          const keyByOrder = typeof b?.order !== "undefined" ? `order:${b.order}` : undefined;
          const stored =
            (keyById ? storedFonts[keyById] : undefined) ||
            (keyByOrder ? storedFonts[keyByOrder] : undefined);

          const apiTitleFont = b.title_font ?? b.titleFont ?? b.title_font_family ?? b.titleFontFamily;
          const apiDescriptionFont = b.description_font ?? b.descriptionFont ?? b.description_font_family ?? b.descriptionFontFamily;
          const apiButtonFont = b.button_font ?? b.buttonFont ?? b.button_font_family ?? b.buttonFontFamily;

          const apiDescriptionFontSizeRaw = b.description_font_size ?? b.descriptionFontSize ?? b.description_size ?? b.descriptionSize;
          const apiDescriptionFontSize =
            typeof apiDescriptionFontSizeRaw === "number"
              ? apiDescriptionFontSizeRaw
              : typeof apiDescriptionFontSizeRaw === "string" && apiDescriptionFontSizeRaw.trim() !== ""
                ? Number(apiDescriptionFontSizeRaw)
                : undefined;

          const apiDescriptionBoldRaw = b.description_bold ?? b.descriptionBold ?? b.is_description_bold ?? b.isDescriptionBold;
          const apiDescriptionBold =
            typeof apiDescriptionBoldRaw === "boolean"
              ? apiDescriptionBoldRaw
              : apiDescriptionBoldRaw === 1 || apiDescriptionBoldRaw === "1" || apiDescriptionBoldRaw === "true"
                ? true
                : apiDescriptionBoldRaw === 0 || apiDescriptionBoldRaw === "0" || apiDescriptionBoldRaw === "false"
                  ? false
                  : undefined;

          const apiButtonFontSizeRaw = b.button_font_size ?? b.buttonFontSize ?? b.button_size ?? b.buttonSize;
          const apiButtonFontSize =
            typeof apiButtonFontSizeRaw === "number"
              ? apiButtonFontSizeRaw
              : typeof apiButtonFontSizeRaw === "string" && apiButtonFontSizeRaw.trim() !== ""
                ? Number(apiButtonFontSizeRaw)
                : undefined;

          const apiButtonBoldRaw = b.button_bold ?? b.buttonBold ?? b.is_button_bold ?? b.isButtonBold;
          const apiButtonBold =
            typeof apiButtonBoldRaw === "boolean"
              ? apiButtonBoldRaw
              : apiButtonBoldRaw === 1 || apiButtonBoldRaw === "1" || apiButtonBoldRaw === "true"
                ? true
                : apiButtonBoldRaw === 0 || apiButtonBoldRaw === "0" || apiButtonBoldRaw === "false"
                  ? false
                  : undefined;

          const apiTitleFontSizeRaw = b.title_font_size ?? b.titleFontSize ?? b.title_size ?? b.titleSize;
          const apiTitleFontSize =
            typeof apiTitleFontSizeRaw === "number"
              ? apiTitleFontSizeRaw
              : typeof apiTitleFontSizeRaw === "string" && apiTitleFontSizeRaw.trim() !== ""
                ? Number(apiTitleFontSizeRaw)
                : undefined;

          const apiTitleBoldRaw = b.title_bold ?? b.titleBold ?? b.is_title_bold ?? b.isTitleBold;
          const apiTitleBold =
            typeof apiTitleBoldRaw === "boolean"
              ? apiTitleBoldRaw
              : apiTitleBoldRaw === 1 || apiTitleBoldRaw === "1" || apiTitleBoldRaw === "true"
                ? true
                : apiTitleBoldRaw === 0 || apiTitleBoldRaw === "0" || apiTitleBoldRaw === "false"
                  ? false
                  : undefined;

          return {
            id: b.id,
            preview: (b.id && localPreviews[b.id]) ? localPreviews[b.id] : serverPreview,
            title: b.title,
            title_font: apiTitleFont ?? stored?.title_font,
            title_font_size:
              (typeof apiTitleFontSize === "number" && Number.isFinite(apiTitleFontSize))
                ? apiTitleFontSize
                : stored?.title_font_size,
            // Default to bold (matches current frontend styling) if unset.
            title_bold: typeof apiTitleBold === "boolean" ? apiTitleBold : (typeof stored?.title_bold === "boolean" ? stored?.title_bold : true),
            description: b.description,
            description_font: apiDescriptionFont ?? stored?.description_font,
            description_font_size:
              (typeof apiDescriptionFontSize === "number" && Number.isFinite(apiDescriptionFontSize))
                ? apiDescriptionFontSize
                : stored?.description_font_size,
            // Default to non-bold (matches current frontend styling) if unset.
            description_bold:
              typeof apiDescriptionBold === "boolean"
                ? apiDescriptionBold
                : (typeof stored?.description_bold === "boolean" ? stored?.description_bold : false),
            button_text: b.button_text,
            button_font: apiButtonFont ?? stored?.button_font,
            button_font_size:
              (typeof apiButtonFontSize === "number" && Number.isFinite(apiButtonFontSize))
                ? apiButtonFontSize
                : stored?.button_font_size,
            // Default to bold (matches current CTA styling) if unset.
            button_bold:
              typeof apiButtonBold === "boolean"
                ? apiButtonBold
                : (typeof stored?.button_bold === "boolean" ? stored?.button_bold : true),
            url: b.url,
            alt: b.alt,
            order: typeof b.order !== 'undefined' ? b.order : i,
          };
        })
      );

      setAlbumExists(true);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setAlbumExists(false);
      }
    } finally {

    }
  };

  /* ======================
   * Image Upload
   * ====================== */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArr = Array.from(files);
    setBanners((prev) => {
      const newBanners: BannerForm[] = fileArr.map((file, idx) => ({
        image: file,
        preview: URL.createObjectURL(file),
        order: prev.length + idx,
      }));
      return [...prev, ...newBanners];
    });

    e.target.value = "";
  };

  const handleRemoveBanner = (index: number) => {
    setBanners((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragStart = (index: number, e: React.DragEvent) => {
    // Allow dragging the whole card, but avoid accidental drags while editing fields.
    const target = e.target as HTMLElement | null;
    if (
      target?.closest(
        "input, textarea, select, option, button, a, [contenteditable='true'], [data-no-drag='true']"
      )
    ) {
      e.preventDefault();
      return;
    }

    dragIndexRef.current = index;
    setDraggingIndex(index);
    try {
      e.dataTransfer?.setData("text/plain", String(index));
    } catch {}
    e.dataTransfer!.effectAllowed = "move";
  };

  const handleDragOver = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer!.dropEffect = "move";
  };

  const handleDrop = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    const from = dragIndexRef.current;
    if (from === null || from === undefined) return;
    if (from === index) {
      setDraggingIndex(null);
      dragIndexRef.current = null;
      return;
    }

    setBanners((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      // update explicit order fields to match new positions
      return next.map((b, i) => ({ ...b, order: i }));
    });

    setDraggingIndex(null);
    dragIndexRef.current = null;
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
    dragIndexRef.current = null;
  };

  const updateBanner = (
    index: number,
    field: keyof BannerForm,
    value: any
  ) => {
    setBanners((prev) => {
      const next = prev.map((b, i) => (i === index ? { ...b, [field]: value } : b));
      const updated = next[index];
      if (field === "preview" && updated?.id) {
        setLocalPreviews((mp) => {
          const prevUrl = mp[updated.id as number];
          if (prevUrl && prevUrl !== value) URL.revokeObjectURL(prevUrl);
          return { ...mp, [updated.id as number]: value };
        });
      }

      if (
        field === "title_font" ||
        field === "title_font_size" ||
        field === "title_bold" ||
        field === "description_font" ||
        field === "description_font_size" ||
        field === "description_bold" ||
        field === "button_font"
        || field === "button_font_size"
        || field === "button_bold"
      ) {
        // persist immediately so it won't reset after save/reload
        persistHomeBannerFonts(next);
      }
      return next;
    });
  };

  const openResizeModal = (index: number) => {
    setResizeIndex(index);
    setCropRect({ x: 0, y: 0, w: 0, h: 0 });
    setResizedPreview(null);
    cropStartRef.current = null;
    setIsDraggingCrop(false);
    // if this banner already has a preview (blob or server) show it as the preview
    const existing = banners[index];
    if (existing?.preview) {
      setResizedPreview(existing.preview as string);
    }
  };

  const closeResizeModal = () => {
    setResizeIndex(null);
    setCropRect({x:0,y:0,w:0,h:0});
    setIsResizing(false);
  };



  useEffect(() => {
    // generate a live preview of the resized image (client-side)
    if (resizeIndex === null) {
      setResizedPreview(null);
      return;
    }

    const banner = banners[resizeIndex];
    const src = banner?.preview;
    if (!src) {
      setResizedPreview(null);
      return;
    }

    const safeSrc = typeof src === "string" ? toProxiedImageUrl(src) : src;

    const img = new Image();
    img.src = safeSrc as string;

    let cancelled = false;

    img.onload = () => {
      if (cancelled) return;

      // If a crop rect exists, generate crop preview
      if (cropRect.w > 0 && cropRect.h > 0) {
        const displayed = imageRef.current;
        if (!displayed) {
          setResizedPreview(null);
          return;
        }

        const dispW = displayed.clientWidth;
        const dispH = displayed.clientHeight;
        const ratioX = img.naturalWidth / dispW;
        const ratioY = img.naturalHeight / dispH;

        const sx = Math.round(cropRect.x * ratioX);
        const sy = Math.round(cropRect.y * ratioY);
        const sw = Math.round(cropRect.w * ratioX);
        const sh = Math.round(cropRect.h * ratioY);

        const canvas = document.createElement("canvas");
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setResizedPreview(null);
          return;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        try {
          const dataUrl = canvas.toDataURL("image/png");
          setResizedPreview(dataUrl);
        } catch (err) {
          setResizedPreview(null);
        }
        return;
      }

      // no default resize preview in crop-only mode
      setResizedPreview(null);
    };

    img.onerror = () => setResizedPreview(null);

    return () => {
      cancelled = true;
    };
  }, [resizeIndex, banners, cropRect]);



  const clampCropRectToImage = (
    next: { x: number; y: number; w: number; h: number },
    imgW: number,
    imgH: number
  ) => {
    const minSize = 20;
    let w = Math.max(minSize, next.w);
    let h = Math.max(minSize, next.h);
    let x = next.x;
    let y = next.y;

    // Clamp size to image
    w = Math.min(w, Math.max(minSize, imgW));
    h = Math.min(h, Math.max(minSize, imgH));

    // Clamp position to image
    x = Math.max(0, Math.min(x, imgW - w));
    y = Math.max(0, Math.min(y, imgH - h));

    return { x, y, w, h };
  };

  const getPointInImage = (e: React.PointerEvent) => {
    const imgEl = imageRef.current;
    if (!imgEl) return null;
    const rect = imgEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return {
      x: Math.max(0, Math.min(x, imgEl.clientWidth)),
      y: Math.max(0, Math.min(y, imgEl.clientHeight)),
      w: imgEl.clientWidth,
      h: imgEl.clientHeight,
    };
  };

  const hitTestHandle = (x: number, y: number, r: { x: number; y: number; w: number; h: number }) => {
    const pad = 14;
    const corners = [
      { id: 'nw' as const, cx: r.x, cy: r.y },
      { id: 'ne' as const, cx: r.x + r.w, cy: r.y },
      { id: 'sw' as const, cx: r.x, cy: r.y + r.h },
      { id: 'se' as const, cx: r.x + r.w, cy: r.y + r.h },
    ];
    for (const c of corners) {
      if (Math.abs(x - c.cx) <= pad && Math.abs(y - c.cy) <= pad) return c.id;
    }
    return null;
  };

  const onCropPointerDown = (e: React.PointerEvent) => {
    const imgEl = imageRef.current;
    if (!imgEl) return;
    const pt = getPointInImage(e);
    if (!pt) return;

    // prevent page scroll while cropping (mobile)
    e.preventDefault();

    const x = pt.x;
    const y = pt.y;
    const imgW = pt.w;
    const imgH = pt.h;

    const hasRect = cropRect.w > 0 && cropRect.h > 0;
    const withinRect =
      hasRect &&
      x >= cropRect.x &&
      x <= cropRect.x + cropRect.w &&
      y >= cropRect.y &&
      y <= cropRect.y + cropRect.h;

    const handle = hasRect ? hitTestHandle(x, y, cropRect) : null;

    if (handle) {
      cropDragRef.current = {
        mode: 'resize',
        handle,
        startX: x,
        startY: y,
        startRect: { ...cropRect },
      };
    } else if (withinRect) {
      cropDragRef.current = {
        mode: 'move',
        startX: x,
        startY: y,
        startRect: { ...cropRect },
      };
    } else {
      // draw a new rect
      cropStartRef.current = { x, y };
      cropDragRef.current = {
        mode: 'draw',
        startX: x,
        startY: y,
        startRect: { x, y, w: 0, h: 0 },
      };
      setCropRect({ x, y, w: 0, h: 0 });
    }

    setIsDraggingCrop(true);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onCropPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingCrop || !cropDragRef.current) return;
    const imgEl = imageRef.current;
    if (!imgEl) return;
    const pt = getPointInImage(e);
    if (!pt) return;

    const x = pt.x;
    const y = pt.y;
    const imgW = pt.w;
    const imgH = pt.h;
    const drag = cropDragRef.current;

    if (drag.mode === 'draw' && cropStartRef.current) {
      const sx = Math.min(cropStartRef.current.x, x);
      const sy = Math.min(cropStartRef.current.y, y);
      const sw = Math.abs(x - cropStartRef.current.x);
      const sh = Math.abs(y - cropStartRef.current.y);
      const next = clampCropRectToImage({ x: sx, y: sy, w: sw, h: sh }, imgW, imgH);
      setCropRect(next);
      return;
    }

    if (drag.mode === 'move') {
      const dx = x - drag.startX;
      const dy = y - drag.startY;
      const next = clampCropRectToImage(
        { x: drag.startRect.x + dx, y: drag.startRect.y + dy, w: drag.startRect.w, h: drag.startRect.h },
        imgW,
        imgH
      );
      setCropRect(next);
      return;
    }

    if (drag.mode === 'resize' && drag.handle) {
      const dx = x - drag.startX;
      const dy = y - drag.startY;
      let next = { ...drag.startRect };

      if (drag.handle === 'nw') {
        next.x = drag.startRect.x + dx;
        next.y = drag.startRect.y + dy;
        next.w = drag.startRect.w - dx;
        next.h = drag.startRect.h - dy;
      } else if (drag.handle === 'ne') {
        next.y = drag.startRect.y + dy;
        next.w = drag.startRect.w + dx;
        next.h = drag.startRect.h - dy;
      } else if (drag.handle === 'sw') {
        next.x = drag.startRect.x + dx;
        next.w = drag.startRect.w - dx;
        next.h = drag.startRect.h + dy;
      } else if (drag.handle === 'se') {
        next.w = drag.startRect.w + dx;
        next.h = drag.startRect.h + dy;
      }

      // normalize if user drags past edges (negative width/height)
      if (next.w < 0) {
        next.x = next.x + next.w;
        next.w = Math.abs(next.w);
      }
      if (next.h < 0) {
        next.y = next.y + next.h;
        next.h = Math.abs(next.h);
      }

      next = clampCropRectToImage(next, imgW, imgH);
      setCropRect(next);
    }
  };

  const onCropPointerUp = () => {
    if (!isDraggingCrop) return;
    setIsDraggingCrop(false);
    cropStartRef.current = null;
    cropDragRef.current = null;
  };

  const resetCropToFullImage = () => {
    const imgEl = imageRef.current;
    if (!imgEl) return;
    setCropRect({ x: 0, y: 0, w: imgEl.clientWidth, h: imgEl.clientHeight });
  };

  const centerCropToAspect = (aspect: number) => {
    const imgEl = imageRef.current;
    if (!imgEl) return;
    const imgW = imgEl.clientWidth;
    const imgH = imgEl.clientHeight;

    let w = imgW;
    let h = Math.round(w / aspect);
    if (h > imgH) {
      h = imgH;
      w = Math.round(h * aspect);
    }

    const x = Math.round((imgW - w) / 2);
    const y = Math.round((imgH - h) / 2);
    setCropRect({ x, y, w, h });
  };

  const performCrop = async () => {
    if (resizeIndex === null) return;
    const banner = banners[resizeIndex];
    const src = banner.preview;
    if (!src) return;
    setIsResizing(true);

    if (cropRect.w <= 0 || cropRect.h <= 0) {
      toast.error("Please select a crop area");
      setIsResizing(false);
      return;
    }

    const displayed = imageRef.current;
    if (!displayed || !displayed.complete) {
      toast.error("Image not loaded yet");
      setIsResizing(false);
      return;
    }

    const dispW = displayed.clientWidth;
    const dispH = displayed.clientHeight;
    const loadImage = async (): Promise<{ img: HTMLImageElement; revoke?: () => void }> => {
      // Prefer the actual File if present (always same-origin)
      if (banner.image instanceof File) {
        const objectUrl = URL.createObjectURL(banner.image);
        const img = new Image();
        img.src = objectUrl;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Failed to load local image"));
        });
        return { img, revoke: () => URL.revokeObjectURL(objectUrl) };
      }

      const srcUrl = typeof src === "string" ? src : null;
      if (!srcUrl) throw new Error("Invalid image source");

      // blob: and data: are safe to draw
      if (srcUrl.startsWith("blob:") || srcUrl.startsWith("data:")) {
        const img = new Image();
        img.src = srcUrl;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Failed to load image"));
        });
        return { img };
      }

      // Already a same-origin URL (including our proxy) -> safe to load directly.
      if (srcUrl.startsWith("/") || !srcUrl.includes("://")) {
        const img = new Image();
        img.src = srcUrl;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Failed to load image"));
        });
        return { img };
      }

      // Remote URLs often taint canvas. Proxy through Next.js (same-origin) to make cropping reliable.
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(srcUrl)}`;

      // Use fetch to our own Next.js API route (same-origin).
      const resp = await fetch(proxyUrl, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!resp.ok) {
        // As a fallback, try direct blob fetch via API axios (may work if CORS is enabled)
        try {
          const direct = await axiosInstance.get(srcUrl, {
            responseType: "blob",
            headers: { "X-No-Loading": "1" },
          });
          const objectUrl = URL.createObjectURL(direct.data);
          const img = new Image();
          img.src = objectUrl;
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Failed to load fetched image"));
          });
          return { img, revoke: () => URL.revokeObjectURL(objectUrl) };
        } catch {
          throw new Error("Failed to fetch image via proxy");
        }
      }

      const blob = await resp.blob();
      const objectUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.src = objectUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load proxied image"));
      });
      return { img, revoke: () => URL.revokeObjectURL(objectUrl) };
    };

    let sourceImg: HTMLImageElement | null = null;
    let revokeSource: (() => void) | undefined;

    try {
      const loaded = await loadImage();
      sourceImg = loaded.img;
      revokeSource = loaded.revoke;
    } catch (err) {
      setIsResizing(false);
      toast.error("Failed to load image for cropping");
      return;
    }

    const imgNaturalW = sourceImg.naturalWidth;
    const imgNaturalH = sourceImg.naturalHeight;
    const ratioX = imgNaturalW / dispW;
    const ratioY = imgNaturalH / dispH;

    let sx = Math.round(cropRect.x * ratioX);
    let sy = Math.round(cropRect.y * ratioY);
    let sw = Math.round(cropRect.w * ratioX);
    let sh = Math.round(cropRect.h * ratioY);

    // clamp values to natural image bounds
    sx = Math.max(0, Math.min(sx, imgNaturalW - 1));
    sy = Math.max(0, Math.min(sy, imgNaturalH - 1));
    sw = Math.max(1, Math.min(sw, imgNaturalW - sx));
    sh = Math.max(1, Math.min(sh, imgNaturalH - sy));

    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsResizing(false);
      return;
    }

    try {
      ctx.drawImage(sourceImg as CanvasImageSource, sx, sy, sw, sh, 0, 0, sw, sh);
    } catch (err) {
      revokeSource?.();
      setIsResizing(false);
      toast.error("Failed to draw image for crop");
      return;
    }

    try {
      let blob: Blob | null = null;

      if (canvas.toBlob) {
        blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), "image/png")
        );
      } else {
        // fallback: use dataURL -> fetch -> blob
        const dataUrl = canvas.toDataURL("image/png");
        const res = await fetch(dataUrl);
        blob = await res.blob();
      }

      if (!blob) {
        setIsResizing(false);
        toast.error("Failed to produce image blob for crop");
        return;
      }

      const file = new File([blob], `cropped-${Date.now()}.png`, { type: blob.type });
      updateBanner(resizeIndex, "image", file);
      updateBanner(resizeIndex, "preview", URL.createObjectURL(file));
      setIsResizing(false);
      closeResizeModal();
    } catch (err) {
      setIsResizing(false);
      toast.error("Failed to generate cropped image");
    } finally {
      revokeSource?.();
    }
  };

  /* ======================
   * Save
   * ====================== */
  const handleSave = async () => {
    // Keep a local fallback in case API doesn't persist these fields yet.
    persistHomeBannerFonts(banners);

    const payload: any = {
      name: "Home Banner",
      transition_in: transitionIn,
      transition_out: transitionOut,
      transition: duration,
      banner_type: "image",
      banners: banners.map((b, i) => ({
        id: b.id,
        title: b.title,
        title_font: b.title_font,
        title_font_size: b.title_font_size,
        title_bold: b.title_bold,
        description: b.description,
        description_font: b.description_font,
        description_font_size: b.description_font_size,
        description_bold: b.description_bold,
        button_text: b.button_text,
        button_font: b.button_font,
        button_font_size: b.button_font_size,
        button_bold: b.button_bold,
        url: b.url,
        alt: b.alt,
        order: typeof b.order !== 'undefined' ? b.order : i,
        image: b.image,
      })),
    };

    if (albumExists) {
      await updateAlbum(HOME_ALBUM_ID, payload);
    } else {
      await createAlbum(payload);
    }

    await loadAlbum();
    toast.success("Home banner updated successfully");
  };

  /* ======================
   * UI
   * ====================== */
  const selectedBanner = resizeIndex !== null && banners[resizeIndex] ? banners[resizeIndex] : null;

  return (
    <div className="container">
      <h3 className="mb-4">Edit Home Banner</h3>

      <div className="mb-3">
        <label className="form-label">Album Name</label>
        <input className="form-control" value="Home Banner" readOnly />
      </div>

      <div className="mb-3">
        <label className="form-label">Transition In</label>
        <select
          className="form-control"
          value={transitionIn}
          onChange={(e) => setTransitionIn(e.target.value)}
        >
          {entranceOptions.map(opt => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label">Transition Out</label>
        <select
          className="form-control"
          value={transitionOut}
          onChange={(e) => setTransitionOut(e.target.value)}
        >
          {exitOptions.map(opt => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label">Transition Duration (seconds)</label>
        <input
          type="range"
          className="form-range"
          min={1}
          max={10}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        />
        <small className="text-muted">{duration}s</small>
      </div>

      {/* Banner Type */}
      <div className="mb-3">
        <label className="form-label">Banner Type</label>
        <div className="form-check">
          <input
            type="radio"
            className="form-check-input"
            id="imageBanner"
            checked
            readOnly
          />
          <label className="form-check-label" htmlFor="imageBanner">
            Image
          </label>
        </div>
      </div>

      {/* Upload Images */}
      <div className="mb-4">
        <label className="form-label">Banner Images</label>
        <div className="d-flex gap-2 align-items-center justify-content-between flex-wrap">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => document.getElementById("imageUpload")?.click()}
          >
            Upload Images
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setShowPublicPreview((s) => !s)}
            title="Toggle public homepage preview"
          >
            {showPublicPreview ? "Hide public view" : "Show public view"}
          </button>
        </div>

        <input
          id="imageUpload"
          type="file"
          className="d-none"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
        />
      </div>

      {showPublicPreview && (
        <div className="card mb-4">
          <div className="card-body" style={{ padding: 0 }}>
            <iframe
              src="/public/home"
              style={{ width: "100%", height: 650, border: 0 }}
              title="Public homepage preview"
            />
          </div>
        </div>
      )}

      {/* Banners */}
      <div className="row mb-4">
        {banners.map((banner, index) => (
          <div key={index} className="col-md-4 mb-4">
            <div
              className={`card h-100 cms-banner-card ${
                draggingIndex === index ? "cms-banner-card--dragging" : ""
              }`}
              draggable
              onDragStart={(e) => handleDragStart(index, e)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(index, e)}
              onDrop={(e) => handleDrop(index, e)}
            >
              <div
                className="cms-banner-drag-handle"
                title="Drag to reorder"
                aria-label="Drag to reorder"
              >
                <i className="fa-solid fa-grip-lines" />
              </div>

              <img
                src={banner.preview}
                className="card-img-top"
                alt="Banner"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                style={{ height: "200px", objectFit: "cover" }}
              />

              <div className="card-body">
                {/* Simple font preview (family/size/bold) */}
                <div
                  className="mb-3"
                  style={{
                    border: "1px dashed rgba(0,0,0,0.18)",
                    background: "rgba(248,249,250,0.9)",
                    borderRadius: 10,
                    padding: 12,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      ...(banner.description_font ? ({ fontFamily: banner.description_font } as const) : {}),
                      ...(typeof banner.description_font_size === "number" && Number.isFinite(banner.description_font_size)
                        ? ({ fontSize: Math.max(10, Math.min(18, banner.description_font_size)) } as const)
                        : ({ fontSize: 12 } as const)),
                      ...(typeof banner.description_bold === "boolean"
                        ? ({ fontWeight: banner.description_bold ? 700 : 400 } as const)
                        : ({ fontWeight: 400 } as const)),
                      color: "#555",
                      lineHeight: 1.2,
                      marginBottom: 6,
                    }}
                  >
                    {(banner.description || "Description preview").toString()}
                  </div>

                  <div
                    style={{
                      ...(banner.title_font ? ({ fontFamily: banner.title_font } as const) : {}),
                      ...(typeof banner.title_font_size === "number" && Number.isFinite(banner.title_font_size)
                        ? ({ fontSize: Math.max(14, Math.min(34, banner.title_font_size)) } as const)
                        : ({ fontSize: 22 } as const)),
                      ...(typeof banner.title_bold === "boolean"
                        ? ({ fontWeight: banner.title_bold ? 900 : 400 } as const)
                        : ({ fontWeight: 900 } as const)),
                      color: "#222",
                      lineHeight: 1.1,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginBottom: 10,
                    }}
                  >
                    {(banner.title || "Title preview").toString()}
                  </div>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "6px 14px",
                      borderRadius: 999,
                      border: "1px solid rgba(0,0,0,0.08)",
                      background: "#fff",
                      color: "#ec1d25",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      ...(banner.button_font ? ({ fontFamily: banner.button_font } as const) : {}),
                      ...(typeof banner.button_font_size === "number" && Number.isFinite(banner.button_font_size)
                        ? ({ fontSize: Math.max(10, Math.min(16, banner.button_font_size)) } as const)
                        : ({ fontSize: 11 } as const)),
                      ...(typeof banner.button_bold === "boolean"
                        ? ({ fontWeight: banner.button_bold ? 800 : 400 } as const)
                        : ({ fontWeight: 800 } as const)),
                    }}
                  >
                    {(banner.button_text || "Button").toString()}
                  </span>
                </div>

                <div className="mb-2">
                  <label className="form-label">Title</label>
                  <input
                    className="form-control"
                    value={banner.title || ""}
                    onChange={(e) =>
                      updateBanner(index, "title", e.target.value)
                    }
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label">Title Font</label>
                  <div className="d-flex gap-2 align-items-center flex-nowrap" style={{ width: "100%" }}>
                    <div className="position-relative" style={{ flex: "1 1 auto", minWidth: 0 }}>
                      <select
                        className="form-control pe-5"
                        value={banner.title_font || ""}
                        onChange={(e) =>
                          updateBanner(index, "title_font", e.target.value || undefined)
                        }
                      >
                        {FONT_FAMILY_OPTIONS.map((opt) => (
                          <option key={opt.label} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <i
                        className="fa-solid fa-chevron-down"
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          right: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          pointerEvents: "none",
                          color: "#6c757d",
                          fontSize: 12,
                        }}
                      />
                    </div>

                    <div style={{ width: 140, flex: "0 0 auto" }}>
                      <div className="input-group">
                        <input
                          type="number"
                          min={10}
                          max={120}
                          step={1}
                          className="form-control"
                          placeholder="Size"
                          value={typeof banner.title_font_size === "number" ? String(banner.title_font_size) : ""}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (!raw) {
                              updateBanner(index, "title_font_size", undefined);
                              return;
                            }
                            const n = Number(raw);
                            if (Number.isFinite(n)) {
                              const clamped = Math.max(10, Math.min(120, Math.round(n)));
                              updateBanner(index, "title_font_size", clamped);
                            }
                          }}
                        />
                        <span className="input-group-text">px</span>
                      </div>
                    </div>

                    <div className="form-check mb-0" style={{ flex: "0 0 auto" }}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`titleBold-${banner.id ?? index}`}
                        checked={banner.title_bold !== false}
                        onChange={(e) => updateBanner(index, "title_bold", e.target.checked)}
                      />
                      <label
                        className="form-check-label"
                        htmlFor={`titleBold-${banner.id ?? index}`}
                      >
                        Bold
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mb-2">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    value={banner.description || ""}
                    onChange={(e) =>
                      updateBanner(index, "description", e.target.value)
                    }
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label">Description Font</label>
                  <div className="d-flex gap-2 align-items-center flex-nowrap" style={{ width: "100%" }}>
                    <div className="position-relative" style={{ flex: "1 1 auto", minWidth: 0 }}>
                      <select
                        className="form-control pe-5"
                        value={banner.description_font || ""}
                        onChange={(e) =>
                          updateBanner(
                            index,
                            "description_font",
                            e.target.value || undefined
                          )
                        }
                      >
                        {FONT_FAMILY_OPTIONS.map((opt) => (
                          <option key={opt.label} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <i
                        className="fa-solid fa-chevron-down"
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          right: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          pointerEvents: "none",
                          color: "#6c757d",
                          fontSize: 12,
                        }}
                      />
                    </div>

                    <div style={{ width: 140, flex: "0 0 auto" }}>
                      <div className="input-group">
                        <input
                          type="number"
                          min={10}
                          max={120}
                          step={1}
                          className="form-control"
                          placeholder="Size"
                          value={typeof banner.description_font_size === "number" ? String(banner.description_font_size) : ""}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (!raw) {
                              updateBanner(index, "description_font_size", undefined);
                              return;
                            }
                            const n = Number(raw);
                            if (Number.isFinite(n)) {
                              const clamped = Math.max(10, Math.min(120, Math.round(n)));
                              updateBanner(index, "description_font_size", clamped);
                            }
                          }}
                        />
                        <span className="input-group-text">px</span>
                      </div>
                    </div>

                    <div className="form-check mb-0" style={{ flex: "0 0 auto" }}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`descBold-${banner.id ?? index}`}
                        checked={banner.description_bold === true}
                        onChange={(e) => updateBanner(index, "description_bold", e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor={`descBold-${banner.id ?? index}`}>
                        Bold
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mb-2">
                  <label className="form-label">Button Text</label>
                  <input
                    className="form-control"
                    value={banner.button_text || ""}
                    onChange={(e) =>
                      updateBanner(index, "button_text", e.target.value)
                    }
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label">Button Font</label>
                  <div className="d-flex gap-2 align-items-center flex-nowrap" style={{ width: "100%" }}>
                    <div className="position-relative" style={{ flex: "1 1 auto", minWidth: 0 }}>
                      <select
                        className="form-control pe-5"
                        value={banner.button_font || ""}
                        onChange={(e) =>
                          updateBanner(index, "button_font", e.target.value || undefined)
                        }
                      >
                        {FONT_FAMILY_OPTIONS.map((opt) => (
                          <option key={opt.label} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <i
                        className="fa-solid fa-chevron-down"
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          right: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          pointerEvents: "none",
                          color: "#6c757d",
                          fontSize: 12,
                        }}
                      />
                    </div>

                    <div style={{ width: 140, flex: "0 0 auto" }}>
                      <div className="input-group">
                        <input
                          type="number"
                          min={10}
                          max={120}
                          step={1}
                          className="form-control"
                          placeholder="Size"
                          value={typeof banner.button_font_size === "number" ? String(banner.button_font_size) : ""}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (!raw) {
                              updateBanner(index, "button_font_size", undefined);
                              return;
                            }
                            const n = Number(raw);
                            if (Number.isFinite(n)) {
                              const clamped = Math.max(10, Math.min(120, Math.round(n)));
                              updateBanner(index, "button_font_size", clamped);
                            }
                          }}
                        />
                        <span className="input-group-text">px</span>
                      </div>
                    </div>

                    <div className="form-check mb-0" style={{ flex: "0 0 auto" }}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`btnBold-${banner.id ?? index}`}
                        checked={banner.button_bold !== false}
                        onChange={(e) => updateBanner(index, "button_bold", e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor={`btnBold-${banner.id ?? index}`}>
                        Bold
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mb-2">
                  <label className="form-label">URL</label>
                  <input
                    type="url"
                    className="form-control"
                    value={banner.url || ""}
                    onChange={(e) =>
                      updateBanner(index, "url", e.target.value)
                    }
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label">Alt Text</label>
                  <input
                    className="form-control"
                    value={banner.alt || ""}
                    onChange={(e) =>
                      updateBanner(index, "alt", e.target.value)
                    }
                  />
                </div>

                <button
                  className="btn btn-outline-danger btn-sm mt-2"
                  onClick={() => handleRemoveBanner(index)}
                >
                  <i className="fa fa-trash"></i> Remove
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm mt-2 ms-2"
                  onClick={() => openResizeModal(index)}
                >
                  <i className="fa fa-edit"></i> Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resize Modal */}
      {selectedBanner && (
        <div className="position-fixed top-0 start-0 w-100 h-100" style={{background: 'rgba(0,0,0,0.5)', zIndex: 2000}}>
          <div className="d-flex align-items-center justify-content-center h-100">
            <div className="card" style={{width: 560}}>
              <div className="card-body">
                <h5 className="card-title">Crop / Resize Banner Image</h5>

                <div className="mb-3">
                  <label className="form-label">Crop Area</label>
                  <div className="d-flex flex-wrap gap-2 mb-2">
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={resetCropToFullImage}>
                      Full Image
                    </button>
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => centerCropToAspect(16/9)}>
                      Center 16:9
                    </button>
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => centerCropToAspect(3)}>
                      Center 3:1
                    </button>
                  </div>

                  <div className="cms-cropper"
                    onPointerDown={onCropPointerDown}
                    onPointerMove={onCropPointerMove}
                    onPointerUp={onCropPointerUp}
                    onPointerCancel={onCropPointerUp}
                    onPointerLeave={onCropPointerUp}
                  >
                    <img
                      ref={imageRef}
                      src={selectedBanner.preview as string}
                      alt="to-crop"
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      onLoad={() => {
                        // default to full-image crop on first load
                        if (cropRect.w <= 0 || cropRect.h <= 0) {
                          resetCropToFullImage();
                        }
                      }}
                      className="cms-cropper__image"
                    />

                    {cropRect.w > 0 && cropRect.h > 0 && (
                      <div
                        className="cms-cropper__rect"
                        style={{ left: cropRect.x, top: cropRect.y, width: cropRect.w, height: cropRect.h }}
                      >
                        <span className="cms-cropper__handle cms-cropper__handle--nw" />
                        <span className="cms-cropper__handle cms-cropper__handle--ne" />
                        <span className="cms-cropper__handle cms-cropper__handle--sw" />
                        <span className="cms-cropper__handle cms-cropper__handle--se" />
                      </div>
                    )}
                  </div>

                  <div className="mt-2">
                    <small className="text-muted">
                      Tip: drag corners to resize, drag inside to move.
                    </small>
                    <div>
                      <small className="text-muted">Crop: {cropRect.w} x {cropRect.h} px</small>
                    </div>
                  </div>
                </div>

                {resizedPreview && (
                  <div className="mb-3">
                    <label className="form-label">Cropped Preview</label>
                    <div>
                      <img src={resizedPreview} alt="crop-preview" style={{maxWidth: '100%', maxHeight: 220, objectFit: 'contain', border: '1px solid #ddd'}} />
                    </div>
                  </div>
                )}
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-primary"
                    onClick={performCrop}
                    disabled={isResizing || (cropRect.w <= 0 && cropRect.h <= 0)}
                  >
                    {isResizing ? 'Processing...' : 'Apply Crop'}
                  </button>
                  <button className="btn btn-secondary" onClick={closeResizeModal} disabled={isResizing}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="d-flex gap-2">
        <button className="btn btn-primary" onClick={handleSave}>
          Update Album
        </button>
      </div>
    </div>
  );
}

HomeBanner.Layout = AdminLayout;
export default HomeBanner;
