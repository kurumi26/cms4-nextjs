import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const user = {
    name: "Thugtech97",
    role: "Admin",
    avatar: "https://avatars.githubusercontent.com/u/34189306?s=96&v=4"
  };
  
  const isActive = (href: string) => pathname === href;

  return (
    <aside
      className="d-flex flex-column flex-shrink-0 p-3 bg-dark text-white"
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
          <div className="text-white small">{user.role}</div>
        </div>
      </div>

      <div className="mb-4">
        <Link href="/" className="nav-link text-white p-0 text-decoration-none d-flex align-items-center">
          🌐 View Website
        </Link>
      </div>

      <div className="mb-3 text-uppercase text-white small fw-bold">
        CMS
      </div>

      <nav className="nav nav-pills flex-column mb-auto">
        {[
          { href: "/dashboard", label: "🏠 Dashboard" },
          { href: "/pages", label: "📄 Pages" },
          { href: "/banners", label: "🖼️ Banners" },
          { href: "/files", label: "📁 Files" },
          { href: "/menu", label: "📌 Menu" },
          { href: "/news", label: "📰 News" },
          { href: "/settings", label: "⚙️ Settings" },
          { href: "/users", label: "👥 Users" },
          { href: "/account-management", label: "🔐 Account Management" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-link text-white mb-2 rounded ${isActive(link.href) ? 'active bg-primary text-white' : ''}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto text-white pt-3 small">
        © {new Date().getFullYear()}
      </div>
    </aside>
  );
}
