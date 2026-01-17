import Link from "next/link";
import { PublicMenuItem } from "@/services/publicPageService";

export default function MenuItem({
  item,
  currentPath,
}: {
  item: PublicMenuItem;
  currentPath: string;
}) {
  const href = item.target;
  const isInternal = item.type === "page";

  const normalizePath = (url: string) => {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  };

  const hrefPath = normalizePath(href);
  const isCurrent = isInternal && (currentPath === hrefPath || currentPath.startsWith(hrefPath + "/"));

  return (
    <li className={`menu-item ${isCurrent ? "current" : ""}`}>
      {isInternal ? (
        <Link href={href} className="menu-link">
          <span>{item.label}</span>
        </Link>
      ) : (
        <a
          href={href}
          className="menu-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>{item.label}</span>
        </a>
      )}

      {item.children && item.children.length > 0 && (
        <ul className="sub-menu-container">
          {item.children.map((child) => (
            <MenuItem
              key={child.id}
              item={child}
              currentPath={currentPath}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
