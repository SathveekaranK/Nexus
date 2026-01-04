
'use client';

import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { Button } from '../ui/button';
import {
  Calendar,
  Settings,
  Bot,
  Music,
  MessageSquare,
  Hash,
  LogOut,
  BookOpen,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CHANNELS } from '@/lib/data';
import { useDispatch } from 'react-redux';
import { logout } from '@/services/auth/authSlice';
import { AppDispatch } from '@/store/store';

export type ViewType = 'dms' | 'channels' | 'ai-chat' | 'music' | 'calendar' | 'resources' | 'settings';

interface WorkspaceSwitcherProps {
  activeViewType: ViewType;
}

const firstDmId = CHANNELS.find(c => c.type === 'dm')?.id;
const firstChannelId = CHANNELS.find(c => c.type === 'channel')?.id;

export default function WorkspaceSwitcher({
  activeViewType,
}: WorkspaceSwitcherProps) {
  const dispatch = useDispatch<AppDispatch>();

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = '/login';
  };

  const mainItems = [
    {
      type: 'dms' as ViewType,
      tooltip: 'Direct Messages',
      icon: <MessageSquare />,
      isActive: activeViewType === 'dms',
      href: `/dms/${firstDmId || ''}`
    },
    {
      type: 'channels' as ViewType,
      tooltip: 'Channels',
      icon: <Hash />,
      isActive: activeViewType === 'channels',
      href: `/channels/${firstChannelId || ''}`
    },
  ] as const;



  // ... (existing code)

  const toolItems = [
    { type: 'ai-chat' as ViewType, tooltip: 'Nexus AI', icon: <Bot />, isActive: activeViewType === 'ai-chat', href: '/ai-chat' },
    { type: 'music' as ViewType, tooltip: 'Music', icon: <Music />, isActive: activeViewType === 'music', href: '/music' },
    { type: 'calendar' as ViewType, tooltip: 'Calendar', icon: <Calendar />, isActive: activeViewType === 'calendar', href: '/calendar' },
    { type: 'resources' as ViewType, tooltip: 'Library', icon: <BookOpen />, isActive: activeViewType === 'resources', href: '/resources' },
  ] as const;

  const footerItems = [
    { type: 'settings' as ViewType, tooltip: 'Settings', icon: <Settings />, isActive: activeViewType === 'settings', href: '/settings' },
  ] as const;

  const renderTooltipButton = (item: any) => (
    <Tooltip key={item.type} delayDuration={0}>
      <TooltipTrigger asChild>
        <Link to={item.href}>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-12 w-12 rounded-lg relative transition-all duration-200 hover:scale-110 group',
              item.isActive &&
              'bg-primary/20 text-primary hover:bg-primary/30 border-l-2 border-primary shadow-lg shadow-primary/10'
            )}
          >
            {item.icon}
            {item.isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-lg shadow-primary/50" />
            )}
          </Button>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{item.tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <div className="flex flex-col items-center gap-2 p-2 bg-background/95 backdrop-blur-xl h-full border-r border-white/5">
      <TooltipProvider>
        {mainItems.map(renderTooltipButton)}

        <div className="my-2 h-px w-8 bg-border" />

        {toolItems.map(renderTooltipButton)}

        <div className="mt-auto flex flex-col gap-2">
          {footerItems.map(renderTooltipButton)}
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-12 w-12 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive hover:scale-110 transition-all"
              >
                <LogOut />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Log Out</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
}
