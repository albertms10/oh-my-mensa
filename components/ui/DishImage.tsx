"use client";

import { dishImageSrc } from "@/lib/images";
import { UtensilsCrossed } from "lucide-react";
import { useState } from "react";

/** Dish photo with a neutral placeholder when there is none or it fails to load. */
export function DishImage({ image, alt, className = "size-10" }: { image?: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const src = dishImageSrc(image);
  if (!src || failed)
    return (
      <span aria-hidden className={`inline-flex shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-400 ${className}`}>
        <UtensilsCrossed className="size-1/2" />
      </span>
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)}
      className={`shrink-0 rounded-md bg-zinc-100 object-cover ${className}`} />
  );
}
