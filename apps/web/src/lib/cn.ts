import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// twMerge resolves conflicting Tailwind utilities (e.g. a caller passing
// `bg-white` to override a component's default `bg-brand-600`) by keeping
// the last one, regardless of class string order.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
