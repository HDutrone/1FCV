'use client';

import { useEffect, useRef } from 'react';

/**
 * Attaches an IntersectionObserver to the returned ref and toggles
 * `.is-visible` (see `.reveal` / `.reveal-scale` in globals.css) once the
 * element scrolls into view — pure CSS handles the actual animation.
 */
export function useReveal<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      },
      { threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}
