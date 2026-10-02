import React from 'react';

interface MultilagosLogoProps {
  variant?: 'light' | 'dark'; // 'light' means for light background (dark text), 'dark' means for dark background (white text)
  className?: string;
  height?: number | string;
}

export const MultilagosLogo: React.FC<MultilagosLogoProps> = ({
  variant = 'dark',
  className = '',
  height = 42,
}) => {
  const isLight = variant === 'light';
  const subtitleColor = isLight ? '#111F24' : '#FFFFFF';
  const lineColor = isLight ? '#111F24' : '#FFFFFF';
  const rCircleColor = isLight ? '#111F24' : '#FFFFFF';

  return (
    <svg
      viewBox="0 0 320 84"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ height }}
      className={`inline-block select-none ${className}`}
      aria-label="MULTILAGOS Negócios & Tecnologia"
    >
      {/* Brand Name "MULTILAGOS" in Official Red #D40B3A */}
      <text
        x="8"
        y="42"
        fill="#D40B3A"
        fontFamily="system-ui, -apple-system, 'Cabinet Grotesk', 'Plus Jakarta Sans', sans-serif"
        fontWeight="800"
        fontSize="38"
        letterSpacing="2.5"
      >
        MULTILAGOS
      </text>

      {/* Registered Trademark symbol (R) */}
      <circle cx="304" cy="22" r="7" stroke={rCircleColor} strokeWidth="1.2" fill="none" />
      <text
        x="304"
        y="25.5"
        fill={rCircleColor}
        fontFamily="sans-serif"
        fontWeight="bold"
        fontSize="8"
        textAnchor="middle"
      >
        R
      </text>

      {/* Thin Horizontal Divider Line */}
      <line
        x1="8"
        y1="51"
        x2="295"
        y2="51"
        stroke={lineColor}
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Tagline "Negócios & Tecnologia" */}
      <text
        x="22"
        y="72"
        fill={subtitleColor}
        fontFamily="system-ui, -apple-system, 'Plus Jakarta Sans', sans-serif"
        fontWeight="500"
        fontSize="21"
        letterSpacing="1"
      >
        Negócios &amp; Tecnologia
      </text>
    </svg>
  );
};
