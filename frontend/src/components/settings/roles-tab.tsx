// @ts-nocheck
import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Shield, Check, Trash2, Plus, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function RolesTab() {
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [newRoleName, setNewRoleName] = useState('');
    const { toast } = useToast();

    const fetchData = async () => {
        try {
            const [usersRes, rolesRes] = await Promise.all([
                api.getUsers(),
                api.getRoles()
            ]);

            setUsers(Array.isArray(usersRes) ? usersRes : usersRes?.data || []);
            setRoles(Array.isArray(rolesRes) ? rolesRes : rolesRes?.data || []);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateRole = async () => {
        if (!newRoleName) return;
        try {
            const res = await api.createRole(newRoleName, []);
            if (res) {
                setRoles([...roles, res]);
                setNewRoleName('');
                toast({ title: "Role Created", description: `${res.name} added.` });
            }
        } catch (e) {
            toast({ title: "Error", description: "Failed to create role." });
        }
    };

    const handleDeleteRole = async (id: string) => {
        try {
            await api.deleteRole(id);
            setRoles(roles.filter(r => r._id !== id));
            toast({ title: "Role Deleted" });
        } catch (e) {
            toast({ title: "Error" });
        }
    };

    const handleToggleUserRole = async (userId: string, roleName: string, currentRoles: string[]) => {
        try {
            const hasRole = currentRoles.includes(roleName);
            let newRoles;

            if (hasRole) {
                newRoles = currentRoles.filter(r => r !== roleName);
            } else {
                newRoles = [...currentRoles, roleName];
            }

            await api.assignUserRoles(userId, newRoles);
            setUsers(users.map(u => u._id === userId ? { ...u, roles: newRoles } : u));
        } catch (e) {
            toast({ title: "Error", description: "Failed to update roles." });
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                {/* Manage Roles */}
                <Card className="bg-secondary/20 border-white/5 h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Roles</CardTitle>
                        <CardDescription>Create and manage available roles.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="New Role Name"
                                value={newRoleName}
                                onChange={e => setNewRoleName(e.target.value)}
                                className="bg-black/20 border-white/10"
                            />
                            <Button size="icon" onClick={handleCreateRole}><Plus className="h-4 w-4" /></Button>
                        </div>
                        <ScrollArea className="h-[250px] pr-4">
                            <div className="space-y-2">
                                {roles.map(role => (
                                    <div key={role._id} className="flex items-center justify-between p-2 bg-black/10 rounded-md border border-white/5">
                                        <span className="font-medium text-sm">{role.name}</span>
                                        {!role.isSystem && (
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteRole(role._id)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Assign Roles */}
                <Card className="bg-secondary/20 border-white/5 h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" /> User Assignments</CardTitle>
                        <CardDescription>Assign multiple roles to users.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-2">
                                {users.map(user => {
                                    const userRoles = user.roles || [];
                                    const availableRoles = ['admin', 'moderator', 'member', ...roles.map(r => r.name)];
                                    // Filter duplicates
                                    const uniqueAvailableRoles = Array.from(new Set(availableRoles));

                                    return (
                                        <div key={user._id} className="flex items-center justify-between p-2 bg-black/10 rounded-md border border-white/5">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <div className="h-8 w-8 min-w-[2rem] rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                                                    {user.name?.[0]?.toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{user.name}</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {userRoles.length > 0 ? (
                                                            userRoles.slice(0, 2).map((r: string) => (
                                                                <span key={r} className="text-[10px] px-1 rounded-full bg-white/10">{r}</span>
                                                            ))
                                                        ) : (
                                                            <span className="text-[10px] text-muted-foreground">No roles</span>
                                                        )}
                                                        {userRoles.length > 2 && <span className="text-[10px] text-muted-foreground">+{userRoles.length - 2}</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-white/10 bg-transparent">
                                                        <ChevronDown className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-[200px]">
                                                    <DropdownMenuLabel>Assign Roles</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    {uniqueAvailableRoles.map(role => (
                                                        <DropdownMenuCheckboxItem
                                                            key={role}
                                                            checked={userRoles.includes(role)}
                                                            onCheckedChange={() => handleToggleUserRole(user._id, role, userRoles)}
                                                        >
                                                            {role.charAt(0).toUpperCase() + role.slice(1)}
                                                        </DropdownMenuCheckboxItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
