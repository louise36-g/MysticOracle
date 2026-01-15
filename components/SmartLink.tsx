import React from 'react';

interface SmartLinkProps {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

/**
 * SmartLink - A hybrid link component that:
 * - Uses real <a> tags with href for SEO and accessibility
 * - Intercepts regular clicks for fast SPA navigation
 * - Allows cmd+click, ctrl+click, middle-click, and right-click to work naturally
 */
export const SmartLink: React.FC<SmartLinkProps> = ({
  href,
  onClick,
  children,
  className,
  ariaLabel,
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Allow modified clicks and middle-clicks to work naturally
    // metaKey = Cmd on Mac, ctrlKey = Ctrl on Windows/Linux
    // button === 1 is middle-click
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) {
      // Let browser handle it (open in new tab)
      return;
    }

    // For regular left-clicks, use SPA navigation
    if (e.button === 0) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      onAuxClick={handleClick} // Handle middle-click
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
};
