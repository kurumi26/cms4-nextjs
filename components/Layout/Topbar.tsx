
import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Topbar() {
const router = useRouter();
  return (
    <nav className="navbar navbar-light bg-white shadow-sm px-4" style={{ height: '64px' }}>
      <div className="container-fluid d-flex justify-content-end align-items-center">
        <div className="dropdown">
          <button
            className="btn btn-dark rounded-circle text-white d-flex align-items-center justify-content-center"
            type="button"
            id="userDropdown"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            style={{ width: '40px', height: '40px', fontSize: '0.875rem', fontWeight: 'bold' }}
          >
            T
          </button>

          <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
            <li>
              <Link href="" className="dropdown-item">
                Account Settings
              </Link>
            </li>
            <li>
              <Link href="" className="dropdown-item">
                Help
              </Link>
            </li>
            <li>
              <hr className="dropdown-divider" />
            </li>
            <li>
              <button className="dropdown-item" onClick={() => router.push("/")}>
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
