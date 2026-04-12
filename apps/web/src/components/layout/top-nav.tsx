'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Video,
  Share2,
  Send,
  Sparkles,
  Plug,
  Users,
  CheckSquare,
  BookOpen,
  MessageSquare,
  Moon,
  Sun,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ai-chat', label: 'AI Chat', icon: MessageSquare },
  { href: '/video-studio', label: 'Video Studio', icon: Video },
  { href: '/social-media', label: 'Social Media', icon: Share2 },
  { href: '/post-composer', label: 'Post Composer', icon: Send },
  { href: '/features', label: 'Features', icon: Sparkles },
  { href: '/integrations', label: 'Integrations', icon: Plug },
  { href: '/teams', label: 'Teams', icon: Users },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/directory', label: 'Directory', icon: BookOpen },
];

export function TopNav() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/60 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 dark:border-white/10 dark:bg-slate-950/85 dark:supports-[backdrop-filter]:bg-slate-950/70">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/dashboard" className="mr-2 flex shrink-0 items-center gap-3">
          <div className="surface-glow flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <span className="block text-sm font-bold tracking-tight">AgentOS</span>
            <span className="block text-[11px] text-muted-foreground">AI operating layer</span>
          </div>
        </Link>

        {/* Nav items */}
        <nav className="flex flex-1 items-center gap-1 overflow-x-auto scrollbar-hide rounded-2xl border border-white/70 bg-white/55 px-2 py-1.5 dark:border-white/10 dark:bg-white/5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-all',
                  isActive
                    ? 'surface-glow bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-white hover:text-foreground dark:hover:bg-white/10 dark:hover:text-white',
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="ml-2 flex shrink-0 items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-white/65 text-muted-foreground transition-colors hover:text-foreground dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:text-white"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {user && (
            <div className="ml-1 flex items-center gap-2 rounded-2xl border border-white/70 bg-white/65 p-1.5 pl-2 dark:border-white/10 dark:bg-white/5">
              <div className="hidden text-right sm:block">
                <p className="max-w-24 truncate text-sm font-medium">{user.name}</p>
                <p className="text-[11px] text-muted-foreground">{user.role}</p>
              </div>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={logout}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
