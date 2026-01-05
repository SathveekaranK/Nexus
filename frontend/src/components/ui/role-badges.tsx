import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RoleBadgesProps {
    roles?: string[];
    className?: string; // Allow external styling
}

const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
        case 'admin':
        case 'owner':
            return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20";
        case 'moderator':
            return "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20";
        case 'vip':
            return "bg-purple-500/10 text-purple-500 border-purple-500/20 hover:bg-purple-500/20";
        case 'dj':
            return "bg-pink-500/10 text-pink-500 border-pink-500/20 hover:bg-pink-500/20";
        case 'member':
            return "bg-gray-500/10 text-gray-500 border-gray-500/20 hover:bg-gray-500/20";
        default:
            return "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20";
    }
};

export function RoleBadges({ roles, className }: RoleBadgesProps) {
    if (!roles || roles.length === 0) return null;

    return (
        <div className={cn("flex flex-wrap gap-1.5 justify-center", className)}>
            {roles.map((role) => (
                <Badge
                    key={role}
                    variant="outline"
                    className={cn("capitalize px-2 py-0.5 text-xs font-medium border", getRoleColor(role))}
                >
                    {role}
                </Badge>
            ))}
        </div>
    );
}
