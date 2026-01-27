import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type SidebarProps = {
  isOpen?: boolean;
  isMobile?: boolean;
  onClose?: () => void;
  width?: number | string;
};

export default function Sidebar({ isOpen, isMobile, onClose, width }: SidebarProps) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const MenuLabel = ({ icon, text }: { icon: string; text: string }) => (
    <span className="cms-sidebar__label-row">
      <span className="cms-sidebar__label-left">
        <span className="cms-sidebar__icon" aria-hidden="true">
          <i className={icon} />
        </span>
        <span className="cms-sidebar__label-text">{text}</span>
      </span>
    </span>
  );

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => {
      const isCurrentlyOpen = prev[key];

      return { [key]: !isCurrentlyOpen };
    });
  };

  const user = {
    name: "Thugtech97",
    role: "Admin",
    avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTokZliYkKkA5G-4WfbuaNpKj5f9PYnTUPLA&s"
  };

  const isActive = (href: string) => pathname === href;

  const menuItems = [
    {
      label: <MenuLabel icon="fa-solid fa-house" text="Dashboard" />,
      href: "/dashboard",
    },
    {
      label: <MenuLabel icon="fa-solid fa-file-lines" text="Pages" />,
      href: "/pages",
      children: [
        { label: "Manage Pages", href: "/pages" },
        { label: "Create a Page", href: "/pages/create" },
        { label: "Layout Presets", href: "/pages/presets" }
      ]
    },
    {
      label: <MenuLabel icon="fa-solid fa-images" text="Banners" />,
      href: "/banners",
      children: [
        { label: "Manage Home Banner", href: "/banners/home" },
        { label: "Manage Subpage Banners", href: "/banners" },
        { label: "Create an Album", href: "/banners/create"}
      ]
    },
    { label: <MenuLabel icon="fa-solid fa-folder-open" text="Files" />, href: "/files" },
    {
      label: <MenuLabel icon="fa-solid fa-bars" text="Menu" />,
      href: "/menu",
      children: [
        { label: "Manage Menu", href: "/menu" },
        { label: "Create a Menu", href: "/menu/create" },
      ]
    },
    {
      label: <MenuLabel icon="fa-solid fa-newspaper" text="News" />,
      href: "/news",
      children: [
        { label: "Manage News", href: "/news" },
        { label: "Create News", href: "/news/create" },
        { label: "Manage Categories", href: "/news/category_index"},
        { label: "Create a Category", href: "/news/category_create"}
      ]
    },
    {
      label: <MenuLabel icon="fa-solid fa-gear" text="Settings" />,
      href: "/settings",
      children: [
        { label: "Account Settings", href: "/settings/account" },
        { label: "Website Settings", href: "/settings/website" },
        { label: "Audit Trail", href: "/settings/audit"}
      ]
    },
    {
      label: <MenuLabel icon="fa-solid fa-users" text="Users" />,
      href: "/users",
      children: [
        { label: "Manage Users", href: "/users" },
        { label: "Create a User", href: "/users/create" },
      ]
    },
    {
      label: <MenuLabel icon="fa-solid fa-user-shield" text="Account Management" />,
      href: "/account-management",
      children: [
        { label: "Roles", href: "/account-management/roles" },
        { label: "Access Rights", href: "/account-management/access_rights" },
      ]
    }
  ];

  return (
    <aside
      className={`cms-sidebar d-flex flex-column flex-shrink-0 p-3 ${
        isOpen ? "cms-sidebar--open" : ""
      }`}
      style={
        width != null
          ? ({
              ["--cms-sidebar-width" as any]:
                typeof width === "number" ? `${width}px` : width,
            } as React.CSSProperties)
          : undefined
      }
      aria-hidden={isMobile && isOpen === false ? true : undefined}
    >
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h1 className="cms-sidebar__brand fs-5 fw-bold m-0">Admin Portal</h1>

        <button
          type="button"
          className="btn btn-sm btn-outline-light d-lg-none"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      <div className="cms-sidebar__user d-flex align-items-center mb-4">
        <img
          src={user.avatar}
          alt="Avatar"
          className="rounded-circle me-2"
          style={{ width: "40px", height: "40px", objectFit: "cover" }}
        />
        <div>
          <div className="fw-bold">{user.name}</div>
          <div className="text-white small">{user.role}</div>
        </div>
      </div>

      <div className="mb-4">
        <Link
          href="/public/home"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-link text-white p-0 text-decoration-none d-flex align-items-center"
        >
          <span className="cms-sidebar__icon" aria-hidden="true">
            <i className="fa-solid fa-globe" />
          </span>
          <span>View Website</span>
        </Link>
      </div>

      <div className="mb-3 text-uppercase text-white small fw-bold">
        CMS
      </div>

      <nav className="cms-sidebar__nav nav nav-pills flex-column mb-auto">
        {menuItems.map((item: any, index) => (
          <div key={index}>

            {"children" in item ? (
              <>
                <button
                  onClick={() => toggleMenu(item.href)}
                  className={`cms-sidebar__button nav-link text-white mb-2 rounded w-100 text-start border-0 bg-transparent ${
                    pathname?.startsWith(item.href) ? "active" : ""
                  }`}
                >
                  <span className="cms-sidebar__item-row d-flex align-items-center justify-content-between">
                    <span className="cms-sidebar__item-label">{item.label}</span>
                    <i
                      className={`cms-sidebar__chevron fa-solid fa-chevron-down ms-2 ${
                        openMenus[item.href] ? "fa-rotate-180" : ""
                      }`}
                      style={{ fontSize: "0.75rem", opacity: 0.85 }}
                    />
                  </span>
                </button>

                {openMenus[item.href] && (
                  <div className="cms-sidebar__submenu ms-3 ps-2">
                    {item.children.map((child: any) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onClose}
                        className={`cms-sidebar__link nav-link text-white mb-1 ${
                          isActive(child.href) ? "active" : ""
                        }`}
                        style={{ fontSize: "12px" }}
                      >
                        <span className="cms-sidebar__child">{child.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (

              <Link
                href={item.href}
                onClick={onClose}
                className={`cms-sidebar__link nav-link text-white mb-2 rounded ${
                  isActive(item.href) ? "active" : ""
                }`}
              >
                {item.label}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* FOOTER */}
      <div className="mt-auto text-white pt-3 small">
        © {new Date().getFullYear()}
      </div>
    </aside>
  );
}
