'use client';

import { useReveal } from '@/hooks/useReveal';

interface RevealProps {
  children: React.ReactNode;
  as?: 'div' | 'section' | 'li';
  variant?: 'up' | 'scale';
  delayMs?: number;
  className?: string;
}

export function Reveal({ children, as = 'div', variant = 'up', delayMs = 0, className = '' }: RevealProps) {
  const ref = useReveal<HTMLDivElement>();
  const Tag = as as any;
  return (
    <Tag
      ref={ref}
      className={`${variant === 'up' ? 'reveal' : 'reveal-scale'} ${className}`}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </Tag>
  );
}
