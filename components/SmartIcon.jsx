"use client";

// NOTE: approximation of the Smart pinwheel for the build. The brand guide
// asks that provided assets be used — replace the blade paths with the
// official SVG paths when marketing supplies the asset file.
const COLOURS = ["#B91982", "#B41E1E", "#FA7855", "#FAB419", "#82E196", "#46C1BE", "#6EC8F5", "#463282"];

export default function SmartIcon({ size = 40, mono = false, spin = false }) {
  const colours = mono ? Array(8).fill("#FFFFFF") : COLOURS;
  const bladeA = "M -8,-46 L 12,-41 L 8,-17 L -12,-22 Z";
  const bladeB = "M -11,-44 L 9,-42 L 11,-19 L -9,-17 Z";
  return (
    <svg viewBox="-50 -50 100 100" width={size} height={size}
      className={spin ? "sw-icon-spin" : ""} aria-hidden="true">
      {colours.map((fill, i) => (
        <path key={i} d={i % 2 === 0 ? bladeA : bladeB} fill={fill} transform={`rotate(${i * 45})`} />
      ))}
    </svg>
  );
}
