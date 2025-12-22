import AdminLayout from "@/components/Layout/AdminLayout";
import { useEffect, useState } from "react";
import TinyEditor from "@/components/UI/Editor";
import { getPageById, updatePage } from "@/services/pageService";
import { useRouter } from "next/router";

export default function EditPage() {
  const router = useRouter();
  const { id } = router.query;

  // Page state
  const [title, setTitle] = useState("");
  const [label, setLabel] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState(true);

  // SEO
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // ✅ Load page data
  useEffect(() => {
    if (!id) return;

    getPageById(Number(id))
      .then((res) => {
        const page = res.data;

        setTitle(page.name);
        setLabel(page.label || "");
        setContent(page.contents);
        setVisibility(page.status === "public");
        setSeoTitle(page.meta_title || "");
        setSeoDescription(page.meta_description || "");
        setSeoKeywords(page.meta_keyword || "");
      })
      .finally(() => setInitialLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Page title is required");
      return;
    }

    try {
      setLoading(true);

      await updatePage(Number(id), {
        name: title,
        label: label || undefined,
        contents: content,
        status: visibility ? "public" : "private",
        meta_title: seoTitle || undefined,
        meta_description: seoDescription || undefined,
        meta_keyword: seoKeywords || undefined,
      });

      alert("Page updated successfully");
      router.push("/pages");

    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || "Failed to update page");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h3 className="mb-4">Edit Page</h3>

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
            <label className="form-label">Page Content</label>
            <TinyEditor
              initialValue={content}
              onChange={(html: string) => setContent(html)}
            />
          </div>

          <div className="form-check form-switch mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              checked={visibility}
              onChange={() => setVisibility(!visibility)}
            />
            <label className="form-check-label">
              {visibility ? "Public" : "Private"}
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
          {loading ? "Saving..." : "Update Page"}
        </button>

        <button
          className="btn btn-outline-secondary"
          type="button"
          onClick={() => router.back()}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

EditPage.Layout = AdminLayout;
