import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, Music, User, Settings } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming you have a utility for merging classes

export default function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      icon: MessageSquare,
      label: 'Chat',
      path: '/', // or wherever the main chat is
      isActive: (path: string) => path === '/' || path.startsWith('/channels') || path.startsWith('/dm')
    },
    {
      icon: Music,
      label: 'Music',
      path: '/music',
      isActive: (path: string) => path === '/music'
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/settings',
      isActive: (path: string) => path === '/settings'
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border z-50 md:hidden pb-safe">
      <div className="flex items-center justify-around h-full">
        {tabs.map((tab) => {
          const active = tab.isActive(location.pathname);
          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              title={tab.label}
            >
              <tab.icon className={cn("h-5 w-5", active && "fill-current")} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
