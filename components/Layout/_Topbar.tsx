import React from "react";
import Link from "next/link";
import Menu from "./_Menu";

export default function LandingTopbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
      <div className="container">
        <Link href="/public/home" className="navbar-brand fw-bold">
          Cms5
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#landingNavbar"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="landingNavbar">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 gap-lg-3">
            <Menu />
          </ul>
        </div>
      </div>
    </nav>
  );
}
