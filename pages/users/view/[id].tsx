import { useEffect, useState } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import { useRouter } from "next/router";
import { getUser } from "@/services/userService";
import { toast } from "@/lib/toast";

function ViewUser() {
  const router = useRouter();
  const { id } = router.query;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    getUser(Number(id))
      .then((u) => setUser(u))
      .catch(() => toast.error("Failed to load user"))
      .finally(() => setLoading(false));
  }, [id]);

  const statusLabel = (u: any) => {
    const raw = (u?.status ?? u?.is_active ?? u?.active ?? "").toString().toLowerCase();
    if (raw === "active" || raw === "1" || raw === "true") return "Active";
    if (raw === "inactive" || raw === "0" || raw === "false") return "Inactive";
    return u?.status ?? "—";
  };

  return (
    <div className="container">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="mb-0">View User</h3>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => router.back()} type="button">
            Back
          </button>
          {typeof id === "string" && (
            <button className="btn btn-primary" onClick={() => router.push(`/users/edit/${id}`)} type="button">
              Edit
            </button>
          )}
        </div>
      </div>

      {loading && <div className="alert alert-light">Loading...</div>}

      {!loading && !user && <div className="alert alert-warning">User not found.</div>}

      {!loading && user && (
        <div className="card">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">First Name</label>
                <div className="form-control bg-light">{user.fname ?? "—"}</div>
              </div>
              <div className="col-md-6">
                <label className="form-label">Last Name</label>
                <div className="form-control bg-light">{user.lname ?? "—"}</div>
              </div>
              <div className="col-md-6">
                <label className="form-label">Email</label>
                <div className="form-control bg-light" style={{ fontFamily: "monospace" }}>
                  {user.email ?? "—"}
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label">Role</label>
                <div className="form-control bg-light">{user.role ?? "—"}</div>
              </div>
              <div className="col-md-6">
                <label className="form-label">Status</label>
                <div>
                  <span className={`badge ${statusLabel(user) === "Active" ? "bg-success" : "bg-secondary"}`}>
                    {statusLabel(user)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ViewUser.Layout = AdminLayout;
export default ViewUser;
