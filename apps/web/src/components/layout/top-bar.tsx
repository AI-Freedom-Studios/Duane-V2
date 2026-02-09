'use client';

import { useAuth } from '@/lib/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TopBar() {
  const { user } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div />
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
            3
          </span>
        </Button>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-sm font-medium">{user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground">{user?.role || 'Member'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
