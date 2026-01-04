// @ts-nocheck
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Music, Bot, User, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

export default function BottomNav() {
    const location = useLocation();
    const { user } = useSelector((state: RootState) => state.auth);

    const navItems = [
        { icon: MessageSquare, label: 'Chat', path: '/dms' }, // Default to DMs
        { icon: Music, label: 'Music', path: '/music' },
        { icon: Bot, label: 'AI', path: '/ai-chat' },
        { icon: BookOpen, label: 'Library', path: '/resources' },
        { icon: User, label: 'Profile', path: '/settings' },
    ];

    const isActive = (path: string) => {
        if (path === '/dms' && (location.pathname.startsWith('/channels') || location.pathname.startsWith('/dms'))) return true;
        return location.pathname.startsWith(path);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-xl border-t border-white/5 flex items-center justify-around z-50 md:hidden pb-safe shadow-2xl">
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
