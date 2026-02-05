import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/Layout/AdminLayout";
import { BannerForm } from "@/schemas/banner";
import { OptionItem, getOptions } from "@/services/optionService";
import { createAlbum } from "@/services/albumService";
import { toast } from "@/lib/toast";

function CreateAlbum() {
  const router = useRouter();

  /* ======================
   * State
   * ====================== */
  const [name, setName] = useState("");
  const [transitionIn, setTransitionIn] = useState("");
  const [transitionOut, setTransitionOut] = useState("");
  const [duration, setDuration] = useState(2);

  const [banners, setBanners] = useState<BannerForm[]>([]);

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

    // allow re-selecting same file
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
    if (!name || !transitionIn || !transitionOut || banners.length === 0) {
      toast.error("Please fill in all required fields.")
      return;
    }

    const payload : any = {
      name,
      transition_in: transitionIn,
      transition_out: transitionOut,
      transition: duration,
      banner_type: "image",
      banners: banners.map((b, i) => ({
        title: b.title,
        title_font: b.title_font,
        description: b.description,
        description_font: b.description_font,
        button_text: b.button_text,
        button_font: b.button_font,
        url: b.url,
        alt: b.alt,
        order: i,
        image: b.image,
      })),
    };

    await createAlbum(payload);
    toast.success("Album created successfully!");
    router.push("/banners");
  };

  /* ======================
   * UI
   * ====================== */
  return (
    <div className="container">
      <h3 className="mb-4">Create an Album</h3>

      {/* Album Name */}
      <div className="mb-3">
        <label className="form-label">
          Album Name <span className="text-danger">*</span>
        </label>
        <input
          className="form-control"
          placeholder="Enter album name"
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
          Transition Duration (seconds) <span className="text-danger">*</span>
        </label>
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

      {/* Upload Images */}
      <div className="mb-4">
        <label className="form-label">
          Album Images <span className="text-danger">*</span>
        </label>
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

      {/* Preview banners */}
      {banners.length > 0 && (
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
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      value={banner.description || ""}
                      onChange={(e) =>
                        updateBanner(index, "description", e.target.value)
                      }
                    />
                  </div>

                  <button
                    className="btn btn-outline-danger btn-sm mt-2"
                    onClick={() => handleRemoveBanner(index)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="d-flex gap-2">
        <button className="btn btn-primary" onClick={handleSave}>
          Save Album
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

CreateAlbum.Layout = AdminLayout;
export default CreateAlbum;
