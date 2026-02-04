import Image from "next/image";
import { useState } from "react";

type Props = {
  images: string[];
};

export default function EventGallery({ images }: Props) {
  const [index, setIndex] = useState(0);

  return (
    <div className="bo-rad-10 of-hidden pos-relative">
      <Image
        src={`/images/${images[index]}`}
        alt="Event image"
        width={900}
        height={600}
      />

      {images.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 6,
          }}
        >
          {images.map((_, i) => (
            <span
              key={i}
              onClick={() => setIndex(i)}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: i === index ? "#fff" : "rgba(255,255,255,0.5)",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
