export type AppId =
  | 'files'
  | 'notes'
  | 'editor'
  | 'calculator'
  | 'terminal'
  | 'settings'
  | 'browser'
  | 'calendar'
  | 'sysmon'
  | 'music'
  | 'about'
  | 'store'
  | 'webapp';

export interface WindowInstance {
  id: string;
  app_id: AppId;
  title: string;
  icon: string;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
  z_index: number;
  is_minimized: boolean;
  is_maximized: boolean;
  payload?: Record<string, unknown>;
}

export interface UserSettings {
  wallpaper: string;
  theme: 'dark' | 'light';
  accent_color: string;
  auto_lock_minutes: number;
  sound_enabled: boolean;
  sfx_volume: number;
}

export const DEFAULT_SETTINGS: UserSettings = {
  wallpaper: 'tuxedo',
  theme: 'dark',
  accent_color: 'sky',
  auto_lock_minutes: 5,
  sound_enabled: true,
  sfx_volume: 50,
};

export interface FileNode {
  id: string;
  name: string;
  parent_id: string | null;
  type: 'file' | 'folder';
  content: string | null;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string;
  color: string;
  created_at: string;
}

export interface InstalledApp {
  id: string;
  user_id: string;
  app_id: string;
  name: string;
  icon: string;
  url: string;
  color: string;
  category: string;
  installed_at: string;
}

export interface CatalogApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  url: string;
  color: string;
  category: string;
  tags: string[];
  featured?: boolean;
}

export const APP_CATALOG: CatalogApp[] = [
  // Productivity
  {
    id: 'excalidraw',
    name: 'Excalidraw',
    description: 'Virtual whiteboard for sketching hand-drawn diagrams',
    icon: 'PenTool',
    url: 'https://excalidraw.com',
    color: 'from-violet-400 to-violet-600',
    category: 'productivity',
    tags: ['drawing', 'diagrams', 'whiteboard'],
    featured: true,
  },
  {
    id: 'notion-like',
    name: 'Notion',
    description: 'All-in-one workspace for notes, docs and databases',
    icon: 'BookOpen',
    url: 'https://www.notion.so',
    color: 'from-slate-400 to-slate-600',
    category: 'productivity',
    tags: ['notes', 'docs', 'workspace'],
  },
  {
    id: 'trello',
    name: 'Trello',
    description: 'Kanban boards for project and task management',
    icon: 'LayoutDashboard',
    url: 'https://trello.com',
    color: 'from-blue-400 to-blue-600',
    category: 'productivity',
    tags: ['kanban', 'tasks', 'project management'],
  },
  {
    id: 'figma',
    name: 'Figma',
    description: 'Collaborative UI/UX design and prototyping tool',
    icon: 'Figma',
    url: 'https://www.figma.com',
    color: 'from-pink-400 to-orange-500',
    category: 'design',
    tags: ['design', 'ui', 'prototyping'],
    featured: true,
  },
  {
    id: 'linear',
    name: 'Linear',
    description: 'Modern issue tracking for software teams',
    icon: 'Zap',
    url: 'https://linear.app',
    color: 'from-indigo-400 to-indigo-600',
    category: 'productivity',
    tags: ['issues', 'bugs', 'project management'],
  },
  // Dev tools
  {
    id: 'github',
    name: 'GitHub',
    description: 'Host and review code, manage projects, build software',
    icon: 'Github',
    url: 'https://github.com',
    color: 'from-slate-600 to-slate-800',
    category: 'development',
    tags: ['git', 'code', 'open source'],
    featured: true,
  },
  {
    id: 'stackblitz',
    name: 'StackBlitz',
    description: 'Instant full-stack web IDE in the browser',
    icon: 'Bolt',
    url: 'https://stackblitz.com',
    color: 'from-blue-400 to-cyan-500',
    category: 'development',
    tags: ['ide', 'coding', 'web dev'],
    featured: true,
  },
  {
    id: 'codesandbox',
    name: 'CodeSandbox',
    description: 'Online code editor and prototyping tool',
    icon: 'Box',
    url: 'https://codesandbox.io',
    color: 'from-slate-500 to-slate-700',
    category: 'development',
    tags: ['ide', 'sandbox', 'react'],
  },
  {
    id: 'replit',
    name: 'Replit',
    description: 'Code, create, and learn with an AI-powered IDE',
    icon: 'Code2',
    url: 'https://replit.com',
    color: 'from-orange-400 to-orange-600',
    category: 'development',
    tags: ['ide', 'ai', 'coding'],
  },
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Deploy and manage web applications globally',
    icon: 'Triangle',
    url: 'https://vercel.com/dashboard',
    color: 'from-slate-700 to-black',
    category: 'development',
    tags: ['deploy', 'hosting', 'serverless'],
  },
  {
    id: 'regex101',
    name: 'Regex101',
    description: 'Build, test and debug regular expressions',
    icon: 'Search',
    url: 'https://regex101.com',
    color: 'from-emerald-400 to-teal-600',
    category: 'development',
    tags: ['regex', 'debug', 'tools'],
  },
  // Media & creative
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Watch and discover videos from around the world',
    icon: 'Play',
    url: 'https://www.youtube.com',
    color: 'from-red-500 to-red-700',
    category: 'media',
    tags: ['video', 'streaming', 'entertainment'],
    featured: true,
  },
  {
    id: 'spotify-web',
    name: 'Spotify Web',
    description: 'Stream millions of songs and podcasts',
    icon: 'Music2',
    url: 'https://open.spotify.com',
    color: 'from-green-400 to-green-600',
    category: 'media',
    tags: ['music', 'audio', 'streaming'],
    featured: true,
  },
  {
    id: 'canva',
    name: 'Canva',
    description: 'Design graphics, presentations, and social media posts',
    icon: 'Palette',
    url: 'https://www.canva.com',
    color: 'from-cyan-400 to-teal-500',
    category: 'design',
    tags: ['design', 'graphics', 'presentations'],
  },
  // Reference
  {
    id: 'wikipedia',
    name: 'Wikipedia',
    description: 'Free encyclopedia with millions of articles',
    icon: 'BookOpen',
    url: 'https://en.wikipedia.org',
    color: 'from-slate-400 to-slate-600',
    category: 'reference',
    tags: ['encyclopedia', 'knowledge', 'reference'],
  },
  {
    id: 'mdn',
    name: 'MDN Web Docs',
    description: 'Official web development reference and guides',
    icon: 'FileCode',
    url: 'https://developer.mozilla.org',
    color: 'from-orange-400 to-orange-600',
    category: 'reference',
    tags: ['docs', 'html', 'css', 'javascript'],
  },
  {
    id: 'devdocs',
    name: 'DevDocs',
    description: 'Fast, offline-capable API documentation browser',
    icon: 'FileCode',
    url: 'https://devdocs.io',
    color: 'from-teal-400 to-teal-600',
    category: 'reference',
    tags: ['docs', 'api', 'offline'],
  },
  // Games & fun
  {
    id: 'chess',
    name: 'Chess.com',
    description: 'Play chess online against humans and computers',
    icon: 'Crown',
    url: 'https://www.chess.com/play/computer',
    color: 'from-amber-500 to-green-700',
    category: 'games',
    tags: ['chess', 'board game', 'strategy'],
    featured: true,
  },
  {
    id: '2048',
    name: '2048',
    description: 'Classic sliding tile number puzzle game',
    icon: 'Grid2x2',
    url: 'https://play2048.co',
    color: 'from-orange-400 to-amber-500',
    category: 'games',
    tags: ['puzzle', 'numbers', 'classic'],
  },
  // Maps & search
  {
    id: 'openstreetmap',
    name: 'OpenStreetMap',
    description: 'Free and open world map built by contributors',
    icon: 'Map',
    url: 'https://www.openstreetmap.org',
    color: 'from-emerald-400 to-emerald-600',
    category: 'tools',
    tags: ['maps', 'navigation', 'open source'],
  },
  {
    id: 'wolfram',
    name: 'Wolfram Alpha',
    description: 'Computational intelligence and knowledge engine',
    icon: 'Calculator',
    url: 'https://www.wolframalpha.com',
    color: 'from-red-400 to-orange-500',
    category: 'tools',
    tags: ['math', 'science', 'computation'],
  },
];

export const WALLPAPERS = [
  'tuxedo',
  'arch',
  'debian',
  'fedora',
  'ubuntu',
  'gentoo',
  'neon',
] as const;

export const ACCENT_COLORS = [
  'sky',
  'emerald',
  'amber',
  'rose',
  'cyan',
  'violet',
] as const;

export const NOTE_COLORS = [
  'amber',
  'rose',
  'emerald',
  'sky',
  'violet',
  'slate',
] as const;

export function wallpaperCss(wp: string): string {
  const map: Record<string, string> = {
    tuxedo:
      'radial-gradient(ellipse 80% 60% at 20% 0%, #0f2a4a 0%, transparent 60%), radial-gradient(ellipse 70% 50% at 80% 20%, #1a1a2e 0%, transparent 55%), radial-gradient(ellipse 60% 80% at 50% 100%, #16213e 0%, transparent 60%), linear-gradient(180deg, #0a0e1a 0%, #0d1117 100%)',
    arch:
      'linear-gradient(135deg, #1793d1 0%, #0a3d62 40%, #0d1117 100%)',
    debian:
      'radial-gradient(ellipse 90% 70% at 30% 30%, #d70a53 0%, transparent 50%), linear-gradient(180deg, #1a0a12 0%, #0d0d0d 100%)',
    fedora:
      'radial-gradient(ellipse 80% 60% at 50% 0%, #294172 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 20% 100%, #3c6eb4 0%, transparent 50%), linear-gradient(180deg, #0a1626 0%, #0d1b2a 100%)',
    ubuntu:
      'radial-gradient(circle at 50% 50%, #e95420 0%, transparent 30%), radial-gradient(ellipse 90% 70% at 50% 100%, #2c001e 0%, transparent 60%), linear-gradient(180deg, #1a0a14 0%, #2c001e 100%)',
    gentoo:
      'radial-gradient(ellipse 80% 60% at 30% 20%, #54487a 0%, transparent 55%), linear-gradient(135deg, #0d1117 0%, #1a1f2e 50%, #54487a 100%)',
    neon:
      'radial-gradient(at 0% 0%, #0f172a 0px, transparent 50%), radial-gradient(at 100% 0%, #1e293b 0px, transparent 50%), radial-gradient(at 100% 100%, #0f172a 0px, transparent 50%), radial-gradient(at 0% 100%, #1e293b 0px, transparent 50%), linear-gradient(135deg, #0f172a 0%, #1a1f2e 100%)',
  };
  return map[wp] ?? map.tuxedo;
}
