"use client";

/**
 * Gallery — a masonry-ish grid of generated artwork with a lightbox viewer and
 * album filter. Images are procedural gradients (no bundled assets), so it
 * loads instantly and works offline.
 */

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface Photo {
  id: number;
  album: string;
  title: string;
  css: string;
  tall?: boolean;
}

const ALBUMS = ["All", "Abstract", "Neon", "Nature", "Space"];

function buildPhotos(): Photo[] {
  const palettes: Record<string, string[]> = {
    Abstract: ["#6366f1,#ec4899", "#06b6d4,#3b82f6", "#f59e0b,#ef4444"],
    Neon: ["#d946ef,#22d3ee", "#a855f7,#ec4899", "#10b981,#84cc16"],
    Nature: ["#16a34a,#65a30d", "#0d9488,#0ea5e9", "#84cc16,#facc15"],
    Space: ["#1e1b4b,#7c3aed", "#0f172a,#1d4ed8", "#581c87,#db2777"],
  };
  const photos: Photo[] = [];
  let id = 1;
  for (const [album, list] of Object.entries(palettes)) {
    list.forEach((pair, i) => {
      const [a, b] = pair.split(",");
      photos.push({
        id: id++,
        album,
        title: `${album} ${i + 1}`,
        css: `linear-gradient(${135 + i * 30}deg, ${a}, ${b})`,
        tall: (id + i) % 3 === 0,
      });
    });
  }
  return photos;
}

const PHOTOS = buildPhotos();

export function GalleryApp() {
  const [album, setAlbum] = useState("All");
  const [lightbox, setLightbox] = useState<Photo | null>(null);

  const photos = useMemo(
    () => (album === "All" ? PHOTOS : PHOTOS.filter((p) => p.album === album)),
    [album],
  );

  return (
    <div className="flex h-full w-full flex-col bg-bg text-text">
      {/* Albums */}
      <div className="flex shrink-0 items-center gap-1 border-b border-border bg-surface px-3 py-2">
        <span className="mr-2 text-sm font-semibold">🖼️ Gallery</span>
        {ALBUMS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAlbum(a)}
            className={`rounded-full px-3 py-1 text-sm transition ${
              album === a ? "bg-accent text-accent-fg" : "text-text-muted hover:bg-surface-elevated"
            }`}
          >
            {a}
          </button>
        ))}
        <span className="ml-auto text-xs text-text-muted">{photos.length} photos</span>
      </div>

      {/* Grid */}
      <div className="nexus-scroll flex-1 overflow-auto p-4">
        <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
          {photos.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setLightbox(p)}
              className="group block w-full overflow-hidden rounded-xl shadow-md transition hover:shadow-xl"
              style={{ background: p.css, height: p.tall ? 220 : 150 }}
            >
              <span className="flex h-full w-full items-end bg-gradient-to-t from-black/40 to-transparent p-2 text-left text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
                {p.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative h-2/3 w-2/3 rounded-2xl shadow-2xl"
              style={{ background: lightbox.css }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute bottom-0 w-full rounded-b-2xl bg-gradient-to-t from-black/60 to-transparent p-4 text-white">
                <p className="text-lg font-semibold">{lightbox.title}</p>
                <p className="text-sm text-white/60">{lightbox.album}</p>
              </div>
              <button
                type="button"
                onClick={() => setLightbox(null)}
                className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-1 text-sm text-white"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
