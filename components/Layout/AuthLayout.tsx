import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  imageUrl?: string;
}

export default function AuthLayout({ children, title, imageUrl }: AuthLayoutProps) {
  return (
    <div className="vh-100 d-flex">
      <div
        className="d-none d-md-block"
        style={{
          flex: 1,
          backgroundImage: `url(${imageUrl || ''})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      ></div>

      <div
        className="d-flex flex-column justify-content-center align-items-center flex: 1 p-4"
        style={{ flex: 1 }}
      >
        <div className="card shadow-sm p-4 w-100" style={{ maxWidth: '400px' }}>
          {title && <h2 className="fw-bold mb-4 text-center">{title}</h2>}
          {children}
        </div>
      </div>
    </div>
  );
}
