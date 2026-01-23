import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function for merging Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 *
 * @example
 * cn("text-red-500", "text-blue-500") // "text-blue-500" (last wins)
 * cn("px-4 py-2", conditional && "bg-blue-500") // conditional class application
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Focus ring utility for consistent focus states
 */
export const focusRing = cn(
  "focus-visible:outline-none focus-visible:ring-2",
  "focus-visible:ring-ring focus-visible:ring-offset-2",
);

/**
 * Disabled utility for consistent disabled states
 */
export const disabled = "disabled:pointer-events-none disabled:opacity-50";
