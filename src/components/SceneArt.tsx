import type { SceneId } from "@/content/missions";

/**
 * Simple illustrations of each mission's plant situation. They show the
 * organ and the problem, never the cell structure that answers it.
 */
export function SceneArt({ scene, className }: { scene: SceneId; className?: string }) {
  return (
    <svg viewBox="0 0 240 160" className={className} role="img" aria-hidden>
      <rect width="240" height="160" rx="18" fill="#edf3e9" />
      {SCENES[scene]}
    </svg>
  );
}

const soil = <path d="M0 122 Q60 114 120 120 T240 118 V160 H0Z" fill="#d9ccb0" />;

const SCENES: Record<SceneId, React.ReactNode> = {
  tuber: (
    <g>
      {soil}
      <path d="M118 30 q-4 30 2 58" stroke="#6e955f" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M118 44 q-22 -14 -34 -6 q14 12 34 6Z" fill="#8eb07c" />
      <path d="M120 38 q22 -16 36 -6 q-16 14 -36 6Z" fill="#8eb07c" />
      <ellipse cx="86" cy="136" rx="34" ry="18" fill="#c9a66b" />
      <ellipse cx="160" cy="134" rx="36" ry="19" fill="#c9a66b" />
      <ellipse cx="160" cy="134" rx="29" ry="14" fill="#f6efd6" />
      <g fill="#e8dcb4">
        <circle cx="150" cy="130" r="2.4" />
        <circle cx="163" cy="138" r="2.4" />
        <circle cx="171" cy="129" r="2.4" />
        <circle cx="156" cy="140" r="2" />
        <circle cx="146" cy="138" r="1.8" />
      </g>
      <path d="M120 92 q-10 20 -30 30 M120 92 q14 22 38 26" stroke="#b49a6a" strokeWidth="2" fill="none" />
    </g>
  ),
  "young-stem": (
    <g>
      {soil}
      <path d="M120 122 C116 96 128 70 116 40" stroke="#6e955f" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M118 78 q-30 -6 -44 6 q22 10 44 -6Z" fill="#8eb07c" />
      <path d="M122 60 q30 -10 44 0 q-22 14 -44 0Z" fill="#8eb07c" />
      <path d="M116 40 q-8 -12 2 -18 q8 8 -2 18Z" fill="#b1caa2" />
      <path d="M176 40 q-10 10 -24 12" stroke="#8a9785" strokeWidth="2" strokeDasharray="4 4" fill="none" />
      <path d="M182 34 l-8 4 l8 4" stroke="#8a9785" strokeWidth="2" fill="none" />
    </g>
  ),
  "hard-shell": (
    <g>
      <ellipse cx="88" cy="88" rx="42" ry="38" fill="#8a6a45" />
      <ellipse cx="88" cy="88" rx="32" ry="28" fill="#f5f1e4" />
      <ellipse cx="88" cy="88" rx="24" ry="20" fill="#ffffff" />
      <rect x="160" y="30" width="20" height="100" rx="6" fill="#a98c62" />
      <path d="M160 52 h20 M160 78 h20 M160 104 h20" stroke="#8a6a45" strokeWidth="2" />
      <path d="M150 20 v14 M190 20 v14" stroke="#b5573f" strokeWidth="2" />
      <path d="M146 30 l4 6 l4 -6 M186 30 l4 6 l4 -6" stroke="#b5573f" strokeWidth="2" fill="none" />
    </g>
  ),
  "shoot-tip": (
    <g>
      {soil}
      <path d="M120 122 V60" stroke="#6e955f" strokeWidth="6" strokeLinecap="round" />
      <path d="M120 60 q-14 -18 0 -36 q14 18 0 36Z" fill="#b1caa2" />
      <circle cx="120" cy="40" r="6" fill="#fff" stroke="#57794a" strokeWidth="2" strokeDasharray="3 3" />
      <path d="M120 122 q-8 14 -4 30 M120 122 q10 12 8 30" stroke="#b49a6a" strokeWidth="3" fill="none" />
      <circle cx="116" cy="152" r="5" fill="#fff" stroke="#57794a" strokeWidth="2" strokeDasharray="3 3" />
      <path d="M150 64 v-28 M144 42 l6 -8 l6 8" stroke="#8a9785" strokeWidth="2" fill="none" />
    </g>
  ),
  "leaf-surface": (
    <g>
      <circle cx="200" cy="28" r="14" fill="#f2d48a" />
      <path d="M40 120 C60 50 160 40 206 96 C150 124 90 130 40 120Z" fill="#8eb07c" />
      <path d="M40 120 C100 100 150 96 206 96" stroke="#57794a" strokeWidth="2" fill="none" />
      <g fill="#cfe7ef">
        <path d="M96 80 q4 -10 0 -18" stroke="#86b9cc" strokeWidth="2" fill="none" />
        <path d="M130 74 q4 -10 0 -18" stroke="#86b9cc" strokeWidth="2" fill="none" />
        <path d="M162 80 q4 -10 0 -18" stroke="#86b9cc" strokeWidth="2" fill="none" />
      </g>
      <path d="M14 60 h30 M10 72 h22" stroke="#b1caa2" strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  stoma: (
    <g>
      <rect x="40" y="30" width="160" height="100" rx="14" fill="#cfe2b2" />
      <ellipse cx="120" cy="80" rx="30" ry="40" fill="#8eb07c" />
      <ellipse cx="120" cy="80" rx="7" ry="26" fill="#f6f8f3" />
      <path d="M84 52 l-18 -8 M84 108 l-18 8" stroke="#86b9cc" strokeWidth="2" />
      <text x="58" y="44" fontSize="10" fill="#57794a">CO₂</text>
      <text x="54" y="128" fontSize="10" fill="#4d8aa0">H₂O</text>
    </g>
  ),
  "tall-tree": (
    <g>
      {soil}
      <rect x="112" y="40" width="16" height="84" rx="5" fill="#a98c62" />
      <circle cx="120" cy="40" r="30" fill="#8eb07c" />
      <circle cx="96" cy="52" r="18" fill="#6e955f" />
      <circle cx="146" cy="52" r="18" fill="#6e955f" />
      <path d="M120 140 q-14 8 -28 10 M120 140 q14 8 30 10" stroke="#a98c62" strokeWidth="4" fill="none" />
      <path d="M172 130 V40" stroke="#4d8aa0" strokeWidth="2.5" strokeDasharray="5 5" />
      <path d="M166 48 l6 -10 l6 10" stroke="#4d8aa0" strokeWidth="2.5" fill="none" />
    </g>
  ),
  "sugar-transport": (
    <g>
      {soil}
      <path d="M120 122 V36" stroke="#6e955f" strokeWidth="5" strokeLinecap="round" />
      <path d="M120 60 q-34 -14 -52 0 q26 16 52 0Z" fill="#8eb07c" />
      <circle cx="150" cy="80" r="11" fill="#e48a6a" />
      <path d="M120 74 q14 0 24 4" stroke="#6e955f" strokeWidth="3" fill="none" />
      <path d="M120 122 q-10 14 -6 30 M120 122 q10 14 6 30" stroke="#b49a6a" strokeWidth="3" fill="none" />
      <path d="M90 64 q-6 30 22 52" stroke="#b8862c" strokeWidth="2" strokeDasharray="4 4" fill="none" />
      <path d="M92 60 q30 -6 52 16" stroke="#b8862c" strokeWidth="2" strokeDasharray="4 4" fill="none" />
    </g>
  ),
  bark: (
    <g>
      <rect x="70" y="18" width="100" height="124" rx="12" fill="#a98c62" />
      <path d="M88 24 q6 30 -2 56 t6 54 M116 20 q-6 34 4 60 t-4 58 M146 24 q8 34 -2 58 t6 52" stroke="#7d6340" strokeWidth="3" fill="none" />
      <path d="M128 70 l10 -6 l-4 12 l12 -2" stroke="#f3f7f0" strokeWidth="2.5" fill="none" />
      <path d="M182 60 h26 M182 80 h20" stroke="#8a9785" strokeWidth="2" strokeLinecap="round" />
      <path d="M40 70 l20 10 l-20 10" stroke="#8a9785" strokeWidth="2" fill="none" />
    </g>
  ),
};
