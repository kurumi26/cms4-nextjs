import AdminLayout from "@/components/Layout/AdminLayout";
import { useState } from "react";
import TinyEditor from "@/components/UI/Editor";
import { createPage } from "@/services/pageService";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { getAlbums } from "@/services/albumService";
import { getMenus } from "@/services/menuService";
import { toast } from "@/lib/toast";
import AiAssistant from "@/components/AI/AiAssistant";
import SelectPreset from "@/components/UI/SelectPreset";
import dynamic from "next/dynamic";
import { extractGrapesParts } from "@/lib/grapesContent";

const GrapesEditor = dynamic(() => import("@/components/UI/GrapesEditor"), { ssr: false });

const DEFAULT_CONTENT = ``;

const getPageSaveErrorMessage = (error: any, mode: "create" | "update") => {
  const apiMessage = error?.response?.data?.message;
  const fallback = mode === "create" ? "Failed to create page" : "Failed to update page";
  const source = [apiMessage, error?.message].filter(Boolean).join(" ");

  if (/pages_slug_unique|duplicate\s+entry|sqlstate\[23000\]/i.test(source)) {
    return "Page slug already exists. Please change Page Title or Label, then save again.";
  }

  if (/insert\s+into\s+`?pages`?|update\s+`?pages`?/i.test(source)) {
    return fallback;
  }

  if (typeof apiMessage === "string" && apiMessage.trim()) {
    return apiMessage;
  }

  return fallback;
};

export default function CreatePage() {
  // Page state
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [label, setLabel] = useState("");
  const [tinyContent, setTinyContent] = useState(DEFAULT_CONTENT);
  const [grapesContent, setGrapesContent] = useState(DEFAULT_CONTENT);
  const [editorType, setEditorType] = useState<"tinymce" | "grapesjs">("tinymce");
  const [visibility, setVisibility] = useState(true);
  const [albumId, setAlbumId] = useState<number | "">("");
  const [albums, setAlbums] = useState<any[]>([]);
  const [menuId, setMenuId] = useState<number | "">("");
  const [menus, setMenus] = useState<any[]>([]);

  // SEO
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");

  // UI
  const [loading, setLoading] = useState(false);

  const handleEditorTypeChange = (nextType: "tinymce" | "grapesjs") => {
    if (nextType === "tinymce" && !tinyContent && grapesContent) {
      setTinyContent(grapesContent);
    }
    if (nextType === "grapesjs" && !grapesContent && tinyContent) {
      setGrapesContent(tinyContent);
    }
    setEditorType(nextType);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Page title is required");
      return;
    }

    try {
      setLoading(true);
      const activeContent = editorType === "grapesjs" ? grapesContent : tinyContent;
      const grapesParts = extractGrapesParts(grapesContent);
      const isGrapes = editorType === "grapesjs";
      const hasGrapesData = Boolean(
        grapesParts.grapes_html?.trim() || grapesParts.grapes_css?.trim() || grapesParts.grapes_js?.trim()
      );

      await createPage({
        name: title,
        label: label || undefined,
        album_id: albumId || undefined,
        // menu_id: menuId || undefined,
        contents: activeContent,
        content_type: isGrapes ? "grapes" : "tiny",
        grapes_html: isGrapes || hasGrapesData ? grapesParts.grapes_html : undefined,
        grapes_css: isGrapes || hasGrapesData ? grapesParts.grapes_css : undefined,
        grapes_js: isGrapes || hasGrapesData ? grapesParts.grapes_js : undefined,
        status: visibility ? "published" : "private",
        meta_title: seoTitle || undefined,
        meta_description: seoDescription || undefined,
        meta_keyword: seoKeywords || undefined,
      });

      toast.success("Page created successfully");

      // ✅ Redirect to pages list
      router.push("/pages");

    } catch (error: any) {
      console.error(error);
      toast.error(getPageSaveErrorMessage(error, "create"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAlbums({ page: 1, per_page: 1000 })
      .then((res) => {
        setAlbums(res.data.data ?? res.data);
      })
      .catch(() => setAlbums([]));
    getMenus({ page: 1, per_page: 1000 })
      .then((res) => setMenus(res.data.data ?? res.data))
      .catch(() => setMenus([]));
  }, []);

  return (
    <div className="container">
      <h3 className="mb-4">Create a Page</h3>

      <div className="card mb-4">
        <div className="card-header fw-bold">Page Details</div>
        <div className="card-body">

          <div className="mb-3">
            <label className="form-label">Page Title</label>
            <input
              type="text"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Page Label</label>
            <input
              type="text"
              className="form-control"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Album (optional)</label>
            <select
              className="form-select"
              value={albumId}
              onChange={(e) =>
                setAlbumId(e.target.value ? Number(e.target.value) : 0)
              }
            >
              <option value="0">— No Album —</option>
              {albums.map((album) => (
                <option key={album.id} value={album.id}>
                  {album.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Menu Group (optional)</label>
            <select
              className="form-select"
              value={menuId}
              onChange={(e) => setMenuId(e.target.value ? Number(e.target.value) : 0)}
            >
              <option value="0">— No Menu —</option>
              {menus.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Layout Presets</label>

            <SelectPreset
              onSelect={(html) => {
                setTinyContent(html);
                setGrapesContent(html);
                toast.success("Layout preset applied");
              }}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Page Content</label>
            <div className="d-flex align-items-center gap-3 mb-2">
              <div className="form-check form-check-inline mb-0">
                <input
                  className="form-check-input"
                  type="radio"
                  name="editorType"
                  id="editorTinyMce"
                  checked={editorType === "tinymce"}
                  onChange={() => handleEditorTypeChange("tinymce")}
                />
                <label className="form-check-label" htmlFor="editorTinyMce">
                  TinyMCE
                </label>
              </div>
              <div className="form-check form-check-inline mb-0">
                <input
                  className="form-check-input"
                  type="radio"
                  name="editorType"
                  id="editorGrapes"
                  checked={editorType === "grapesjs"}
                  onChange={() => handleEditorTypeChange("grapesjs")}
                />
                <label className="form-check-label" htmlFor="editorGrapes">
                  GrapesJS
                </label>
              </div>
            </div>
            {/**
            <AiAssistant
              content={content}
              onApply={(html) => setContent(html)}
            />
             */}
            {editorType === "tinymce" ? (
              <TinyEditor
                value={tinyContent}
                onChange={setTinyContent}
              />
            ) : (
              <GrapesEditor
                value={grapesContent}
                onChange={setGrapesContent}
              />
            )}
          </div>

          <div className="form-check form-switch mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              checked={visibility}
              onChange={() => setVisibility(!visibility)}
            />
            <label className="form-check-label">
              {visibility ? "Published" : "Private"}
            </label>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header fw-bold">Manage SEO</div>
        <div className="card-body">

          <div className="mb-3">
            <label className="form-label">SEO Title</label>
            <input
              type="text"
              className="form-control"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">SEO Description</label>
            <textarea
              rows={4}
              className="form-control"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">SEO Keywords</label>
            <input
              type="text"
              className="form-control"
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="btn-group">
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Page"}
        </button>

        <button
          className="btn btn-outline-secondary"
          type="button"
          onClick={() => window.history.back()}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

CreatePage.Layout = AdminLayout;
