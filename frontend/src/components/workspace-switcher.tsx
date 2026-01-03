
'use client';

import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from './ui/button';
import {
  Calendar,
  Settings,
  Bot,
  Music,
  MessageSquare,
  Hash,
  Bell,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CHANNELS } from '@/lib/data';

export type ViewType = 'dms' | 'channels' | 'ai-chat' | 'music' | 'calendar' | 'settings';

interface WorkspaceSwitcherProps {
  activeViewType: ViewType;
}

const firstDmId = CHANNELS.find(c => c.type === 'dm')?.id;
const firstChannelId = CHANNELS.find(c => c.type === 'channel')?.id;

export default function WorkspaceSwitcher({
  activeViewType,
}: WorkspaceSwitcherProps) {
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

  const toolItems = [
    { type: 'ai-chat' as ViewType, tooltip: 'Nexus AI', icon: <Bot />, isActive: activeViewType === 'ai-chat', href: '/ai-chat' },
    { type: 'music' as ViewType, tooltip: 'Music', icon: <Music />, isActive: activeViewType === 'music', href: '/music' },
    { type: 'calendar' as ViewType, tooltip: 'Calendar', icon: <Calendar />, isActive: activeViewType === 'calendar', href: '/calendar' },
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
              'h-12 w-12 rounded-lg relative',
              item.isActive &&
              'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            {item.icon}
          </Button>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{item.tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <div className="flex flex-col items-center gap-2 p-2 bg-[hsl(var(--sidebar-background))] h-full border-r border-border">
      <TooltipProvider>
        {mainItems.map(renderTooltipButton)}

        <div className="my-2 h-px w-8 bg-border" />

        {toolItems.map(renderTooltipButton)}

        <div className="mt-auto flex flex-col gap-2">
          {footerItems.map(renderTooltipButton)}
        </div>
      </TooltipProvider>
    </div>
  );
}
