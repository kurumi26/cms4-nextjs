import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/Layout/AdminLayout";
import { BannerForm } from "@/schemas/banner";
import { OptionItem, getOptions } from "@/services/optionService";
import { getAlbum, updateAlbum } from "@/services/albumService";
import { toast } from "@/lib/toast";
import { axiosInstance } from "@/services/axios";

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

function EditAlbum() {
  const router = useRouter();
  const { id } = router.query;

  /* ======================
   * State
   * ====================== */

  const [name, setName] = useState("");
  const [transitionIn, setTransitionIn] = useState("");
  const [transitionOut, setTransitionOut] = useState("");
  const [duration, setDuration] = useState(2);

  const [banners, setBanners] = useState<BannerForm[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number }>({ x: 0, y: 0, w: 0, h: 0 });
  const cropStartRef = useRef<{ x: number; y: number } | null>(null);
  const cropDragRef = useRef<null | {
    mode: 'draw' | 'move' | 'resize';
    handle?: 'nw' | 'ne' | 'sw' | 'se';
    startX: number;
    startY: number;
    startRect: { x: number; y: number; w: number; h: number };
  }>(null);
  const [isProcessingCrop, setIsProcessingCrop] = useState(false);
  const [cropPreview, setCropPreview] = useState<string | null>(null);

  const toProxiedImageUrl = (rawUrl: string) => {
    if (!rawUrl) return rawUrl;
    if (rawUrl.startsWith("/")) return rawUrl;
    if (rawUrl.startsWith("blob:") || rawUrl.startsWith("data:")) return rawUrl;
    return `/api/image-proxy?url=${encodeURIComponent(rawUrl)}`;
  };

  const [entranceOptions, setEntranceOptions] = useState<OptionItem[]>([]);
  const [exitOptions, setExitOptions] = useState<OptionItem[]>([]);

  /* ======================
   * Load options
   * ====================== */
  useEffect(() => {
    getOptions({ type: "animation", field_type: "entrance" })
      .then((res: any) => setEntranceOptions(res.data.data));

    getOptions({ type: "animation", field_type: "exit" })
      .then((res: any) => setExitOptions(res.data.data));
  }, []);

  /* ======================
   * Load album
   * ====================== */
  useEffect(() => {
    if (!id) return;
    loadAlbum(Number(id));
  }, [id]);

  const loadAlbum = async (albumId: number) => {
    try {
      const res = await getAlbum(albumId);
      const album = res.data;

      setName(album.name);
      setTransitionIn(String(album.transition_in));
      setTransitionOut(String(album.transition_out));
      setDuration(album.transition);

      setBanners(
        album.banners.map((b: any) => ({
          id: b.id,
          preview: toProxiedImageUrl(`${process.env.NEXT_PUBLIC_API_URL}/storage/${b.image_path}`),
          title: b.title,
          title_font: b.title_font ?? b.titleFont ?? b.title_font_family ?? b.titleFontFamily,
          title_font_size:
            typeof (b.title_font_size ?? b.titleFontSize ?? b.title_size ?? b.titleSize) === "number"
              ? (b.title_font_size ?? b.titleFontSize ?? b.title_size ?? b.titleSize)
              : typeof (b.title_font_size ?? b.titleFontSize ?? b.title_size ?? b.titleSize) === "string" && String((b.title_font_size ?? b.titleFontSize ?? b.title_size ?? b.titleSize)).trim() !== ""
                ? Number(b.title_font_size ?? b.titleFontSize ?? b.title_size ?? b.titleSize)
                : undefined,
          title_bold:
            typeof (b.title_bold ?? b.titleBold ?? b.is_title_bold ?? b.isTitleBold) === "boolean"
              ? (b.title_bold ?? b.titleBold ?? b.is_title_bold ?? b.isTitleBold)
              : (b.title_bold ?? b.titleBold ?? b.is_title_bold ?? b.isTitleBold) === 1 || (b.title_bold ?? b.titleBold ?? b.is_title_bold ?? b.isTitleBold) === "1" || (b.title_bold ?? b.titleBold ?? b.is_title_bold ?? b.isTitleBold) === "true"
                ? true
                : (b.title_bold ?? b.titleBold ?? b.is_title_bold ?? b.isTitleBold) === 0 || (b.title_bold ?? b.titleBold ?? b.is_title_bold ?? b.isTitleBold) === "0" || (b.title_bold ?? b.titleBold ?? b.is_title_bold ?? b.isTitleBold) === "false"
                  ? false
                  : undefined,
          description: b.description,
          description_font: b.description_font ?? b.descriptionFont ?? b.description_font_family ?? b.descriptionFontFamily,
          description_font_size:
            typeof (b.description_font_size ?? b.descriptionFontSize ?? b.description_size ?? b.descriptionSize) === "number"
              ? (b.description_font_size ?? b.descriptionFontSize ?? b.description_size ?? b.descriptionSize)
              : typeof (b.description_font_size ?? b.descriptionFontSize ?? b.description_size ?? b.descriptionSize) === "string" && String((b.description_font_size ?? b.descriptionFontSize ?? b.description_size ?? b.descriptionSize)).trim() !== ""
                ? Number(b.description_font_size ?? b.descriptionFontSize ?? b.description_size ?? b.descriptionSize)
                : undefined,
          description_bold:
            typeof (b.description_bold ?? b.descriptionBold ?? b.is_description_bold ?? b.isDescriptionBold) === "boolean"
              ? (b.description_bold ?? b.descriptionBold ?? b.is_description_bold ?? b.isDescriptionBold)
              : (b.description_bold ?? b.descriptionBold ?? b.is_description_bold ?? b.isDescriptionBold) === 1 || (b.description_bold ?? b.descriptionBold ?? b.is_description_bold ?? b.isDescriptionBold) === "1" || (b.description_bold ?? b.descriptionBold ?? b.is_description_bold ?? b.isDescriptionBold) === "true"
                ? true
                : (b.description_bold ?? b.descriptionBold ?? b.is_description_bold ?? b.isDescriptionBold) === 0 || (b.description_bold ?? b.descriptionBold ?? b.is_description_bold ?? b.isDescriptionBold) === "0" || (b.description_bold ?? b.descriptionBold ?? b.is_description_bold ?? b.isDescriptionBold) === "false"
                  ? false
                  : undefined,
          button_text: b.button_text,
          button_font: b.button_font ?? b.buttonFont ?? b.button_font_family ?? b.buttonFontFamily,
          url: b.url,
          alt: b.alt,
        }))
      );
    } catch (err) {
      toast.error("Album not found");
      router.push("/banners");
    } finally {
    }
  };

  /* ======================
   * Image upload
   * ====================== */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newBanners: BannerForm[] = Array.from(files).map((file) => ({
      image: file,
      preview: URL.createObjectURL(file),
    }));

    setBanners((prev) => [...prev, ...newBanners]);
    e.target.value = "";
  };

  const handleRemoveBanner = (index: number) => {
    setBanners((prev) => {
      const banner = prev[index];
      if (banner.preview?.startsWith("blob:")) {
        URL.revokeObjectURL(banner.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const openEditModal = (index: number) => {
    setEditIndex(index);
    setCropRect({ x: 0, y: 0, w: 0, h: 0 });
    setCropPreview(banners[index]?.preview || null);
    cropStartRef.current = null;
    setIsDraggingCrop(false);
  };

  const closeEditModal = () => {
    setEditIndex(null);
    setCropRect({ x: 0, y: 0, w: 0, h: 0 });
    setIsProcessingCrop(false);
    setCropPreview(null);
  };

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

    w = Math.min(w, Math.max(minSize, imgW));
    h = Math.min(h, Math.max(minSize, imgH));

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
    if (editIndex === null) return;
    const banner = banners[editIndex];
    const src = banner.preview;
    if (!src) return;

    if (cropRect.w <= 0 || cropRect.h <= 0) {
      toast.error("Please select a crop area");
      return;
    }

    const displayed = imageRef.current;
    if (!displayed || !displayed.complete) {
      toast.error("Image not loaded yet");
      return;
    }

    setIsProcessingCrop(true);

    const dispW = displayed.clientWidth;
    const dispH = displayed.clientHeight;
    const loadImage = async (): Promise<{ img: HTMLImageElement; revoke?: () => void }> => {
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

      if (srcUrl.startsWith("blob:") || srcUrl.startsWith("data:")) {
        const img = new Image();
        img.src = srcUrl;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Failed to load image"));
        });
        return { img };
      }

      if (srcUrl.startsWith("/") || !srcUrl.includes("://")) {
        const img = new Image();
        img.src = srcUrl;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Failed to load image"));
        });
        return { img };
      }

      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(srcUrl)}`;
      const resp = await fetch(proxyUrl, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!resp.ok) {
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
    } catch {
      setIsProcessingCrop(false);
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

    sx = Math.max(0, Math.min(sx, imgNaturalW - 1));
    sy = Math.max(0, Math.min(sy, imgNaturalH - 1));
    sw = Math.max(1, Math.min(sw, imgNaturalW - sx));
    sh = Math.max(1, Math.min(sh, imgNaturalH - sy));

    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsProcessingCrop(false);
      toast.error("Canvas not supported");
      return;
    }

    try {
      ctx.drawImage(sourceImg as CanvasImageSource, sx, sy, sw, sh, 0, 0, sw, sh);
    } catch (err) {
      revokeSource?.();
      setIsProcessingCrop(false);
      toast.error("Failed to draw image for crop");
      return;
    }

    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
      if (!blob) throw new Error("no blob");
      const file = new File([blob], `cropped-${Date.now()}.png`, { type: blob.type });
      updateBanner(editIndex, "image", file);
      updateBanner(editIndex, "preview", URL.createObjectURL(file));
      setIsProcessingCrop(false);
      closeEditModal();
    } catch (err) {
      setIsProcessingCrop(false);
      toast.error("Failed to generate cropped image");
    } finally {
      revokeSource?.();
    }
  };

  const updateBanner = (
    index: number,
    field: keyof BannerForm,
    value: any
  ) => {
    setBanners((prev) =>
      prev.map((b, i) => (i === index ? { ...b, [field]: value } : b))
    );
  };

  /* ======================
   * Save
   * ====================== */
  const handleSave = async () => {
    if (!name || !transitionIn || !transitionOut) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const payload : any = {
      name,
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
        url: b.url,
        alt: b.alt,
        order: i,
        ...(b.image instanceof File ? { image: b.image } : {}),
      })),
    };

    try {
      await updateAlbum(Number(id), payload);
      toast.success("Album updated successfully!");
      router.push("/banners");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to update album");
    }
  };

  return (
    <div className="container">
      <h3 className="mb-4">Edit Album</h3>

      {/* Album Name */}
      <div className="mb-3">
        <label className="form-label">
          Album Name <span className="text-danger">*</span>
        </label>
        <input
          className="form-control"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* Transition In */}
      <div className="mb-3">
        <label className="form-label">
          Transition In <span className="text-danger">*</span>
        </label>
        <select
          className="form-control"
          value={transitionIn}
          onChange={(e) => setTransitionIn(e.target.value)}
        >
          <option value="">Select transition</option>
          {entranceOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      </div>

      {/* Transition Out */}
      <div className="mb-3">
        <label className="form-label">
          Transition Out <span className="text-danger">*</span>
        </label>
        <select
          className="form-control"
          value={transitionOut}
          onChange={(e) => setTransitionOut(e.target.value)}
        >
          <option value="">Select transition</option>
          {exitOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      </div>

      {/* Duration */}
      <div className="mb-3">
        <label className="form-label">
          Transition Duration (seconds)
        </label>
        <input
          type="range"
          className="form-range"
          min={2}
          max={10}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        />
        <small className="text-muted">{duration}s</small>
      </div>

      {/* Upload Images */}
      <div className="mb-4">
        <label className="form-label">Album Images</label>
        <button
          type="button"
          className="btn btn-outline-secondary d-block"
          onClick={() => document.getElementById("imageUpload")?.click()}
        >
          Upload Images
        </button>

        <input
          id="imageUpload"
          type="file"
          className="d-none"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
        />
      </div>

      {/* Banners */}
      <div className="row mb-4">
        {banners.map((banner, index) => (
          <div key={index} className="col-md-4 mb-4">
            <div className="card h-100">
              <img
                src={banner.preview}
                className="card-img-top"
                style={{ height: 200, objectFit: "cover" }}
              />

              <div className="card-body">
                {/* Simple font preview (title + description) */}
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
                      marginBottom: 8,
                    }}
                  >
                    {(banner.title || "Title preview").toString()}
                  </div>

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
                      lineHeight: 1.25,
                    }}
                  >
                    {(banner.description || "Description preview").toString()}
                  </div>
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
                        onChange={(e) => updateBanner(index, "title_font", e.target.value || undefined)}
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
                      <label className="form-check-label" htmlFor={`titleBold-${banner.id ?? index}`}>
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
                        onChange={(e) => updateBanner(index, "description_font", e.target.value || undefined)}
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

                <button
                  className="btn btn-outline-danger btn-sm mt-2"
                  onClick={() => handleRemoveBanner(index)}
                >
                  Remove
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm mt-2 ms-2"
                  onClick={() => openEditModal(index)}
                >
                  <i className="fa fa-edit"></i> Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Crop Modal */}
      {editIndex !== null && banners[editIndex] && (
        <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 2000 }}>
          <div className="d-flex align-items-center justify-content-center h-100">
            <div className="card" style={{ width: 640 }}>
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

                  <div
                    className="cms-cropper"
                    onPointerDown={onCropPointerDown}
                    onPointerMove={onCropPointerMove}
                    onPointerUp={onCropPointerUp}
                    onPointerCancel={onCropPointerUp}
                    onPointerLeave={onCropPointerUp}
                  >
                    <img
                      ref={imageRef}
                      src={banners[editIndex].preview}
                      alt="to-crop"
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      onLoad={() => {
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
                    <small className="text-muted">Tip: drag corners to resize, drag inside to move.</small>
                    <div><small className="text-muted">Crop: {cropRect.w} x {cropRect.h} px</small></div>
                  </div>
                  <div className="mt-2"><small className="text-muted">Crop: {cropRect.w} x {cropRect.h} px</small></div>
                </div>

                {cropPreview && (
                  <div className="mb-3">
                    <label className="form-label">Cropped Preview</label>
                    <div>
                      <img src={cropPreview} alt="crop-preview" style={{ maxWidth: '100%', maxHeight: 220, objectFit: 'contain', border: '1px solid #ddd' }} />
                    </div>
                  </div>
                )}

                <div className="d-flex gap-2">
                  <button className="btn btn-primary" onClick={performCrop} disabled={isProcessingCrop || (cropRect.w <= 0 && cropRect.h <= 0)}>
                    {isProcessingCrop ? 'Processing...' : 'Apply Crop'}
                  </button>
                  <button className="btn btn-secondary" onClick={closeEditModal} disabled={isProcessingCrop}>Cancel</button>
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
        <button
          className="btn btn-outline-secondary"
          onClick={() => router.back()}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

EditAlbum.Layout = AdminLayout;
export default EditAlbum;
