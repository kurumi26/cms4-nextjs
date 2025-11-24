import Link from "next/link";

export default function Sidebar() {
  const user = {
    name: "Thugtech97",
    role: "Admin",
    avatar: "https://avatars.githubusercontent.com/u/34189306?s=96&v=4"
  };

  return (
    <aside
      className="d-flex flex-column flex-shrink-0 p-3 bg-light"
      style={{ width: '250px', height: '100vh', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}
    >
        
      <h1 className="fs-4 fw-bold mb-5">Admin Portal</h1>

      <div className="d-flex align-items-center mb-4">
        <img
          src={user.avatar}
          alt="Avatar"
          className="rounded-circle me-2"
          style={{ width: '40px', height: '40px', objectFit: 'cover' }}
        />
        <div>
          <div className="fw-bold">{user.name}</div>
          <div className="text-muted small">{user.role}</div>
        </div>
      </div>

      <div className="mb-4">
        <Link href="/" className="nav-link p-0 text-decoration-none d-flex align-items-center">
          🌐 View Website
        </Link>
      </div>

      <div className="mb-3 text-uppercase text-muted small fw-bold">
        CMS
      </div>

      <nav className="nav nav-pills flex-column mb-auto">
        <Link href="/dashboard" className="nav-link text-dark mb-2 rounded">
          🏠 Dashboard
        </Link>
        <Link href="/pages" className="nav-link text-dark mb-2 rounded">
          📄 Pages
        </Link>
        <Link href="/banners" className="nav-link text-dark mb-2 rounded">
          🖼️ Banners
        </Link>
        <Link href="/files" className="nav-link text-dark mb-2 rounded">
          📁 Files
        </Link>
        <Link href="/menu" className="nav-link text-dark mb-2 rounded">
          📌 Menu
        </Link>
        <Link href="/news" className="nav-link text-dark mb-2 rounded">
          📰 News
        </Link>
        <Link href="/settings" className="nav-link text-dark mb-2 rounded">
          ⚙️ Settings
        </Link>
        <Link href="/users" className="nav-link text-dark mb-2 rounded">
          👥 Users
        </Link>
        <Link href="/account-management" className="nav-link text-dark mb-2 rounded">
          🔐 Account Management
        </Link>
      </nav>

      <div className="mt-auto text-muted pt-3 small">
        © {new Date().getFullYear()}
      </div>
    </aside>
  );
}
