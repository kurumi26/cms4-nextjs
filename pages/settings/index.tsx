// pages/dashboard/settings.tsx
import { useState, ChangeEvent, FormEvent } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";

type TabKey = "personal" | "account";

function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("personal");
  const [firstName, setFirstName] = useState("Adminz");
  const [lastName, setLastName] = useState("Istratorz");
  const [avatarFileName, setAvatarFileName] = useState("300x300 w.jpg");

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: handle save
    console.log({ firstName, lastName, avatarFileName });
  };

  return (
    <div>
      <h3 className="mb-4">Account Settings</h3>

      <div
        className="card"
        style={{ borderRadius: "4px", borderColor: "#e1e5ee" }}
      >
        {/* Tabs */}
        <div className="card-header bg-white border-0 pb-0">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${
                  activeTab === "personal" ? "active" : ""
                }`}
                onClick={() => setActiveTab("personal")}
              >
                Personal
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${
                  activeTab === "account" ? "active" : ""
                }`}
                onClick={() => setActiveTab("account")}
              >
                Account
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body">
          {activeTab === "personal" && (
            <form onSubmit={handleSubmit} style={{ maxWidth: 600 }}>
              {/* Avatar + name */}
              <div className="d-flex align-items-center mb-4">
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    backgroundColor: "#0e0d0cff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "2.5rem",
                    fontWeight: 700,
                    marginRight: 16,
                  }}
                >
                  T
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "1.1rem",
                    }}
                  >
                    Thugtech97
                  </div>
                  <div style={{ color: "#6c757d" }}>Admin</div>
                </div>
              </div>

              {/* Avatar input */}
              <div className="mb-3">
                <label className="form-label">Avatar</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    value={avatarFileName}
                    readOnly
                  />
                  <label className="input-group-text" style={{ cursor: "pointer" }}>
                    Browse
                    <input
                      type="file"
                      accept=".jpeg,.jpg,.png"
                      onChange={handleAvatarChange}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
                <div
                  className="mt-2"
                  style={{ fontSize: "0.8rem", color: "#6c757d" }}
                >
                  <div>Required image dimension: 300px by 300px</div>
                  <div>Maximum file size: 1MB</div>
                  <div>Required file type: .jpeg, .png</div>
                </div>
              </div>

              {/* First name */}
              <div className="mb-3">
                <label className="form-label">
                  First Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>

              {/* Last name */}
              <div className="mb-4">
                <label className="form-label">
                  Last Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ paddingInline: 24 }}
              >
                SAVE CHANGES
              </button>
            </form>
          )}

          {activeTab === "account" && (
            <div style={{ maxWidth: 600 }}>
              {/* Placeholder account tab (you can expand this later) */}
              <h5 className="mb-3">Account</h5>
              <p className="text-muted mb-0">
                Add account-related fields here (email, password, security
                settings, etc.).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

SettingsPage.Layout = AdminLayout;

export default SettingsPage;
