"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface ImageViewerProps {
  src: string;
  alt: string;
  compact?: boolean;
}

export function ImageViewer({ src, alt, compact }: ImageViewerProps) {
  const [zoomed, setZoomed] = useState(false);

  return (
    <>
      <button
        onClick={() => setZoomed(true)}
        className={
          compact
            ? "overflow-hidden rounded-lg border border-sky"
            : "w-full overflow-hidden rounded-lg border border-sky"
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={
            compact
              ? "max-h-28 w-auto object-contain"
              : "h-auto w-full object-contain"
          }
        />
      </button>

      {zoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setZoomed(false)}
        >
          <button
            onClick={() => setZoomed(false)}
            className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/40"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
