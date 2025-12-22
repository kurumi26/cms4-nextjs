import React from "react";
import Link from "next/link";

export default function LandingTopbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
      <div className="container">
        <Link href="/" className="navbar-brand fw-bold">
          MyPlatform
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#landingNavbar"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="landingNavbar">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 gap-lg-3">
            <li className="nav-item">
              <Link href="/public/home" className="nav-link">
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/public/about" className="nav-link">
                About
              </Link>
            </li>
            <li className="nav-item">
              <Link href="#pricing" className="nav-link">
                Pricing
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
