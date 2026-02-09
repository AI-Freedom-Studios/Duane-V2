'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Video,
  Share2,
  PenSquare,
  Sparkles,
  Puzzle,
  Users,
  ListTodo,
  BookOpen,
  Moon,
  Sun,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/video-studio', label: 'Video Studio', icon: Video },
  { href: '/social-media', label: 'Social Media', icon: Share2 },
  { href: '/post-composer', label: 'Post Composer', icon: PenSquare },
  { href: '/features', label: 'Features', icon: Sparkles },
  { href: '/integrations', label: 'Integrations', icon: Puzzle },
  { href: '/teams', label: 'Teams', icon: Users },
  { href: '/tasks', label: 'Tasks', icon: ListTodo },
  { href: '/directory', label: 'Directory', icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold">AgentOS</h1>
              <p className="text-[10px] text-muted-foreground">AI Freedom Studios</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                collapsed && 'justify-center px-2',
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t p-2 space-y-1">
        <button
          onClick={toggleTheme}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors',
            collapsed && 'justify-center px-2',
          )}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {user && (
          <button
            onClick={logout}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors',
              collapsed && 'justify-center px-2',
            )}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Logout</span>}
          </button>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors',
            collapsed && 'justify-center px-2',
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
