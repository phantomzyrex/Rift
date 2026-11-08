import React from 'react';

interface PostProcessingOverlayProps {
  destabilization: number; // 0 to 100
  enabled?: boolean;
}

export const PostProcessingOverlay: React.FC<PostProcessingOverlayProps> = ({
  destabilization,
  enabled = true,
}) => {
  if (!enabled) return null;

  // Modulate intensity with destabilization
  const d = Math.max(0, Math.min(100, destabilization)) / 100;
  const scanlineOpacity = 0.18 + d * 0.14; // 18% to 32%
  const vignetteOpacity = 0.55 + d * 0.25; // 55% to 80%
  const aberrationOffset = (0.5 + d * 2.5).toFixed(1); // 0.5px to 3.0px

  return (
    <div
      className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* SVG Chromatic Aberration Filter */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="rift-chromatic-aberration" x="-5%" y="-5%" width="110%" height="110%">
            <feOffset in="SourceGraphic" dx={aberrationOffset} dy="0" result="redShift" />
            <feColorMatrix
              in="redShift"
              type="matrix"
              values="1 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0.85 0"
              result="redOnly"
            />
            <feOffset in="SourceGraphic" dx={`-${aberrationOffset}`} dy="0" result="cyanShift" />
            <feColorMatrix
              in="cyanShift"
              type="matrix"
              values="0 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 0.85 0"
              result="cyanOnly"
            />
            <feBlend in="redOnly" in2="cyanOnly" mode="screen" result="colorShift" />
            <feBlend in="SourceGraphic" in2="colorShift" mode="screen" />
          </filter>
        </defs>
      </svg>

      {/* 1. Subtle CRT Scanlines Raster */}
      <div
        className="absolute inset-0 mix-blend-overlay"
        style={{
          opacity: scanlineOpacity,
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.45) 2px, rgba(0, 0, 0, 0.45) 4px)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* 2. Decayed CRT Phosphor Grain & Slow Rolling Scanline */}
      <div
        className="absolute inset-0 opacity-10 mix-blend-screen"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
          backgroundSize: '3px 3px',
        }}
      />

      {/* 3. Deep Cinematic Vignette */}
      <div
        className="absolute inset-0"
        style={{
          opacity: vignetteOpacity,
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(3, 7, 18, 0.5) 80%, rgba(2, 6, 23, 0.95) 100%)',
        }}
      />

      {/* 4. Subtle Decayed Asymmetry Glow (Warmer on right, colder on left) */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          background:
            'linear-gradient(90deg, rgba(56, 189, 248, 0.08) 0%, transparent 45%, transparent 55%, rgba(245, 158, 11, 0.12) 100%)',
        }}
      />
    </div>
  );
};
