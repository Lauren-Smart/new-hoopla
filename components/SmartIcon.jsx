"use client";

// Official Smart Commercial Energy pinwheel — blade shapes traced
// directly from the marketing-supplied logo asset (Smart_Logo_RGB-White.png).
const BLADES = [
  { d: "M -7.4,-50.0 L -7.4,-21.5 L 7.4,-21.5 L 7.4,-42.4 Z", fill: "#B91982" },
  { d: "M 30.0,-40.5 L 9.9,-20.4 L 20.2,-10.0 L 35.0,-24.8 Z", fill: "#B41E1E" },
  { d: "M 21.3,7.1 L 42.5,7.1 L 49.8,-7.4 L 21.3,-7.4 Z", fill: "#FA7855" },
  { d: "M 10.2,20.3 L 24.6,35.0 L 40.4,29.9 L 20.6,10.1 Z", fill: "#FAB419" },
  { d: "M -7.4,21.7 L -7.4,42.7 L 7.4,50.0 L 7.2,21.7 Z", fill: "#82E196" },
  { d: "M -20.5,10.1 L -35.4,25.0 L -30.3,40.7 L -10.2,20.6 Z", fill: "#46C1BE" },
  { d: "M -49.8,7.0 L -21.8,7.1 L -21.8,-7.4 L -42.5,-7.4 Z", fill: "#6EC8F5" },
  { d: "M -40.4,-30.2 L -20.3,-10.0 L -9.9,-20.4 L -24.8,-35.3 Z", fill: "#463282" },
];

export default function SmartIcon({ size = 40, mono = false, spin = false }) {
  return (
    <svg viewBox="-54 -54 108 108" width={size} height={size}
      className={spin ? "sw-icon-spin" : ""} aria-hidden="true">
      {BLADES.map((b, i) => (
        <path key={i} d={b.d} fill={mono ? "#FFFFFF" : b.fill} />
      ))}
    </svg>
  );
}
