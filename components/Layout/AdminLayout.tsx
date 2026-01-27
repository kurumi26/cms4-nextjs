import React, { useCallback, useEffect, useRef, useState } from 'react';
import Sidebar from './_Sidebar';
import Topbar from './_Topbar2';
import ToastHost from "@/components/UI/ToastHost";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sidebarToggleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 991px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    // If focus is currently inside the sidebar, move it to the toggle button
    // to avoid aria-hidden warnings from browsers.
    requestAnimationFrame(() => sidebarToggleRef.current?.focus());
  }, []);
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);

  return (
    <div
      className={`cms-admin-layout d-flex vh-100 bg-light ${
        sidebarOpen ? "cms-admin-layout--sidebar-open" : ""
      }`}
    >
      <div className="cms-sidebar-overlay" onClick={closeSidebar} />

      <Sidebar
        isOpen={sidebarOpen}
        isMobile={isMobile}
        onClose={closeSidebar}
        width={300}
      />

      <div className="flex-grow-1 d-flex flex-column">
        <Topbar onToggleSidebar={toggleSidebar} sidebarToggleRef={sidebarToggleRef} />
        <main className="p-4 overflow-auto flex-grow-1">
          {children}
        </main>
      </div>

      <ToastHost />
    </div>
  );
}
