import { cva } from "class-variance-authority";

/**
 * Blog Header Variants
 * Used for BlogHeader component with different sizes
 */
export const blogHeaderVariants = cva(
  "mb-8 text-center",
  {
    variants: {
      size: {
        default: "text-3xl md:text-4xl lg:text-5xl",
        compact: "text-2xl md:text-3xl",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

/**
 * Blog Content Variants
 * Used for blog post content container
 */
export const blogContentVariants = cva(
  "prose prose-invert prose-purple max-w-none",
  {
    variants: {
      spacing: {
        default: "space-y-6",
        compact: "space-y-4",
        relaxed: "space-y-8",
      },
    },
    defaultVariants: {
      spacing: "default",
    },
  }
);

/**
 * Blog FAQ Variants
 * Used for FAQ section container
 */
export const blogFAQVariants = cva(
  "mt-12 rounded-lg border bg-slate-900/40 p-6",
  {
    variants: {
      borderColor: {
        default: "border-purple-500/20",
        accent: "border-purple-500/40",
        muted: "border-slate-700/40",
      },
    },
    defaultVariants: {
      borderColor: "default",
    },
  }
);

/**
 * Blog CTA Variants
 * Used for call-to-action banner
 */
export const blogCTAVariants = cva(
  "mt-12 rounded-lg p-6 text-center",
  {
    variants: {
      variant: {
        default: "bg-purple-600/20 border border-purple-500/30",
        accent: "bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/40",
        subtle: "bg-slate-800/40 border border-slate-700/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

/**
 * Blog Card Variants
 * Used for related posts and article cards
 */
export const blogCardVariants = cva(
  "rounded-lg overflow-hidden transition-all hover:scale-[1.02]",
  {
    variants: {
      variant: {
        default: "bg-slate-900/60 border border-purple-500/20 hover:border-purple-500/40",
        featured: "bg-gradient-to-br from-purple-900/40 to-slate-900/60 border border-purple-500/30",
        minimal: "bg-slate-800/40 border border-slate-700/30",
      },
      size: {
        default: "p-4",
        compact: "p-3",
        large: "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
