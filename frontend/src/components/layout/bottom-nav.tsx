// @ts-nocheck
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Music, Bot, User, BookOpen, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

export default function BottomNav() {
    const location = useLocation();
    const { user } = useSelector((state: RootState) => state.auth);

    const navItems = [
        { icon: Hash, label: 'Channels', path: '/channels' },
        { icon: MessageSquare, label: 'DMs', path: '/dms' },
        { icon: Music, label: 'Music', path: '/music' },
        { icon: Bot, label: 'AI', path: '/ai-chat' },
        { icon: User, label: 'Profile', path: '/settings' },
    ];

    const isActive = (path: string) => {
        if (path === '/dms' && (location.pathname.startsWith('/channels') || location.pathname.startsWith('/dms'))) return true;
        return location.pathname.startsWith(path);
    };

    return (
        <div className="h-16 bg-background/95 backdrop-blur-xl border-t border-white/5 flex items-center justify-around pb-safe shadow-2xl">
            {navItems.map((item) => (
                <Link
                    key={item.label}
                    to={item.path}
                    className={cn(
                        "flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 relative",
                        isActive(item.path)
                            ? "text-primary scale-105"
                            : "text-muted-foreground hover:text-foreground hover:scale-105"
                    )}
                    title={item.label}
                >
                    {isActive(item.path) && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary shadow-lg shadow-primary/50 animate-pulse" />
                    )}
                    <item.icon className={cn("h-5 w-5 transition-all", isActive(item.path) && "drop-shadow-lg")} />
                    <span className={cn("text-[10px] font-medium transition-all", isActive(item.path) && "font-semibold")}>{item.label}</span>
                </Link>
            ))}
        </div>
    );
}
