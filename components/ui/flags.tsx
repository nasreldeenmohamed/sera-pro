"use client";

import * as React from "react";

/**
 * Flag Icon Components
 * 
 * SVG flag icons for language selection.
 * Uses simplified, recognizable flag designs for Egypt and UK.
 * 
 * Features:
 * - Accessible with proper ARIA labels
 * - Scalable SVG for crisp rendering at any size
 * - Lightweight (no external dependencies)
 * - Renders consistently across all platforms
 */

/**
 * UK Flag Icon - Union Jack
 * Simplified but recognizable representation of the British flag
 * Uses official colors: #012169 (blue), #FFFFFF (white), #C8102E (red)
 * 
 * Design optimized for small sizes while maintaining recognizability
 */
export function UKFlag({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 40"
      className={className}
      role="img"
      aria-label="United Kingdom Flag"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Blue background */}
      <rect width="60" height="40" fill="#012169" />
      {/* White diagonal crosses (behind red) */}
      <path
        d="M0 0L60 40M60 0L0 40"
        stroke="#FFFFFF"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Red diagonal crosses */}
      <path
        d="M0 0L60 40M60 0L0 40"
        stroke="#C8102E"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Red vertical cross */}
      <rect x="25" y="0" width="10" height="40" fill="#C8102E" />
      {/* Red horizontal cross */}
      <rect x="0" y="15" width="60" height="10" fill="#C8102E" />
      {/* White vertical cross (outline) */}
      <rect x="27" y="0" width="6" height="40" fill="#FFFFFF" />
      {/* White horizontal cross (outline) */}
      <rect x="0" y="17" width="60" height="6" fill="#FFFFFF" />
    </svg>
  );
}

/**
 * Egypt Flag Icon - Egyptian flag
 * Three horizontal stripes: Red (top), White (middle), Black (bottom)
 * Official colors: #CE1126 (red), #FFFFFF (white), #000000 (black)
 * 
 * Note: The actual Egyptian flag includes a golden eagle in the center,
 * but for small icon size, we use just the stripes for clarity
 */
export function EgyptFlag({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 40"
      className={className}
      role="img"
      aria-label="Egypt Flag"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Red stripe (top third) */}
      <rect width="60" height="13.33" y="0" fill="#CE1126" />
      {/* White stripe (middle third) */}
      <rect width="60" height="13.34" y="13.33" fill="#FFFFFF" />
      {/* Black stripe (bottom third) */}
      <rect width="60" height="13.33" y="26.67" fill="#000000" />
      {/* Simplified golden eagle symbol in center (white stripe) - simplified for small sizes */}
      <circle cx="30" cy="20" r="3.5" fill="#D4AF37" />
      <path
        d="M27 20 Q30 17 33 20 M27 20 Q30 23 33 20"
        stroke="#8B6914"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="30" cy="18.5" r="1.2" fill="#8B6914" />
    </svg>
  );
}

