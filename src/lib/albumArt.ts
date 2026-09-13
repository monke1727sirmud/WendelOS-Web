function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const PALETTES: [string, string, string][] = [
  ['#0ea5e9', '#6366f1', '#1e1b4b'],
  ['#f43f5e', '#8b5cf6', '#1e1b2e'],
  ['#10b981', '#0ea5e9', '#0c4a6e'],
  ['#f59e0b', '#ef4444', '#451a03'],
  ['#8b5cf6', '#ec4899', '#2e1065'],
  ['#14b8a6', '#3b82f6', '#083344'],
  ['#eab308', '#f97316', '#422006'],
  ['#06b6d4', '#3b82f6', '#0c4a6e'],
];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export function generateAlbumArt(id: number, title: string): string {
  const h = hashStr(title + id);
  const [c1, c2, c3] = pick(PALETTES, h);
  const angle = h % 360;
  const cx = 20 + (h % 60);
  const cy = 20 + ((h >> 3) % 60);
  const r = 30 + (h % 40);
  const variant = h % 4;

  let shapes = '';
  if (variant === 0) {
    // Concentric circles
    for (let i = 0; i < 5; i++) {
      shapes += `<circle cx="${cx}" cy="${cy}" r="${r - i * 10}" fill="none" stroke="white" stroke-opacity="${0.08 + i * 0.04}" stroke-width="2"/>`;
    }
  } else if (variant === 1) {
    // Diagonal lines
    for (let i = 0; i < 8; i++) {
      const off = i * 14;
      shapes += `<line x1="${-20 + off}" y1="120" x2="${100 + off}" y2="0" stroke="white" stroke-opacity="${0.05 + i * 0.03}" stroke-width="1.5"/>`;
    }
  } else if (variant === 2) {
    // Grid of dots
    for (let x = 15; x < 100; x += 18) {
      for (let y = 15; y < 100; y += 18) {
        shapes += `<circle cx="${x}" cy="${y}" r="2.5" fill="white" fill-opacity="0.12"/>`;
      }
    }
  } else {
    // Triangles
    for (let i = 0; i < 4; i++) {
      const tx = 20 + i * 22;
      shapes += `<polygon points="${tx},80 ${tx + 18},50 ${tx + 36},80" fill="white" fill-opacity="${0.06 + i * 0.03}"/>`;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="bg${id}" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(${angle} 50 50)">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="50%" stop-color="${c2}"/>
      <stop offset="100%" stop-color="${c3}"/>
    </linearGradient>
    <radialGradient id="glow${id}" cx="${cx}%" cy="${cy}%">
      <stop offset="0%" stop-color="white" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100" height="100" fill="url(#bg${id})"/>
  ${shapes}
  <rect width="100" height="100" fill="url(#glow${id})"/>
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function generateWallpaper(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="35%" stop-color="#1e293b"/>
      <stop offset="70%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#475569"/>
    </linearGradient>
    <radialGradient id="sun" cx="50%" cy="60%" r="40%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.3"/>
      <stop offset="40%" stop-color="#ef4444" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="mtn1" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="mtn2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#sky)"/>
  <rect width="1920" height="1080" fill="url(#sun)"/>
  <circle cx="960" cy="650" r="80" fill="#fbbf24" opacity="0.15"/>
  <circle cx="960" cy="650" r="50" fill="#f59e0b" opacity="0.25"/>
  <path d="M0,1080 L0,750 L200,650 L400,720 L600,600 L850,680 L1100,580 L1350,660 L1600,590 L1920,640 L1920,1080 Z" fill="url(#mtn2)" opacity="0.7"/>
  <path d="M0,1080 L0,820 L150,740 L350,790 L550,700 L800,760 L1050,690 L1300,750 L1550,680 L1750,730 L1920,700 L1920,1080 Z" fill="url(#mtn1)"/>
  <g fill="white" opacity="0.6">
    <circle cx="200" cy="150" r="1.5"/>
    <circle cx="450" cy="80" r="1"/>
    <circle cx="700" cy="200" r="1.2"/>
    <circle cx="1100" cy="120" r="1"/>
    <circle cx="1400" cy="90" r="1.5"/>
    <circle cx="1650" cy="180" r="1"/>
    <circle cx="300" cy="250" r="0.8"/>
    <circle cx="900" cy="60" r="1.3"/>
    <circle cx="1200" cy="220" r="0.9"/>
    <circle cx="1550" cy="250" r="1.1"/>
  </g>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
