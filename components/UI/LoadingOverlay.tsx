import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

interface Props {
  loading: boolean;
  text?: string;
}

export default function LoadingOverlay({ loading, text = "Loading..." }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !loading) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        background: "rgba(0,0,0,0.4)",
      }}
    >
      <div className="h-100 d-flex align-items-center justify-content-center">
        <div className="bg-white px-4 py-3 rounded shadow">
          <span className="me-2 spinner-border spinner-border-sm" />
          {text}
        </div>
      </div>
    </div>,
    document.body
  );
}
