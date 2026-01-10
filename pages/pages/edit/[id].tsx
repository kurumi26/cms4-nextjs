import AdminLayout from "@/components/Layout/AdminLayout";
import { useEffect, useState } from "react";
import TinyEditor from "@/components/UI/Editor";
import { getPageById, updatePage } from "@/services/pageService";
import { useRouter } from "next/router";
import { getAlbums } from "@/services/albumService";
import { toast } from "@/lib/toast";
import AiAssistant from "@/components/AI/AiAssistant";

function EditPage() {
  const router = useRouter();
  const { id } = router.query;

  // Page state
  const [title, setTitle] = useState("");
  const [label, setLabel] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState(true);
  const [albumId, setAlbumId] = useState<number | "">("");
  const [albums, setAlbums] = useState<any[]>([]);

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
        setAlbumId(page.album_id ?? ""); // ✅ HERE
        setContent(page.contents);
        setVisibility(page.status === "published");
        setSeoTitle(page.meta_title || "");
        setSeoDescription(page.meta_description || "");
        setSeoKeywords(page.meta_keyword || "");
      })
      .finally(() => setInitialLoading(false));
  }, [id]);

  useEffect(() => {
    getAlbums({ page: 1, per_page: 1000 })
      .then((res) => {
        setAlbums(res.data.data ?? res.data);
      })
      .catch(() => setAlbums([]));
  }, []);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Page title is required");
      return;
    }

    try {
      setLoading(true);

      await updatePage(Number(id), {
        name: title,
        label: label || undefined,
        album_id: albumId, // ✅ ADD
        contents: content,
        status: visibility ? "published" : "private",
        meta_title: seoTitle || undefined,
        meta_description: seoDescription || undefined,
        meta_keyword: seoKeywords || undefined,
      });

      toast.success("Page updated successfully");
      router.push("/pages");

    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to update page");
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
              disabled={Number(id) == 1}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Page Label</label>
            <input
              type="text"
              className="form-control"
              value={label}
              disabled={Number(id) == 1}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          {Number(id) !== 1 && (
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
          )}

          <div className="mb-3">
            <label className="form-label">Page Content</label>
            <AiAssistant
              content={content}
              onApply={(html) => setContent(html)}
            />
            <TinyEditor
              value={content}
              onChange={setContent}
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

export async function getServerSideProps() {
  return { props: {} };
}

export default EditPage;
