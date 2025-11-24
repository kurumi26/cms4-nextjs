import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="d-flex vh-100 bg-light">
      <Sidebar />

      <div className="flex-grow-1 d-flex flex-column">
        <Topbar />

        <main className="p-4 overflow-auto flex-grow-1">
          {children}
        </main>
      </div>
    </div>
  );
}
