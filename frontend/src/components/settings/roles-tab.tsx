// @ts-nocheck
import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Shield, Check, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';

export default function RolesTab() {
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [newRoleName, setNewRoleName] = useState('');
    const { toast } = useToast();

    const fetchData = async () => {
        try {
            const [usersRes, rolesRes] = await Promise.all([
                api.getUsers(),
                api.get('roles') // Assuming api.get wrapper exists or fetch manually
            ]);

            // Handling diverse API response structures
            if (usersRes?.success) setUsers(usersRes.data);
            else if (Array.isArray(usersRes)) setUsers(usersRes);

            if (Array.isArray(rolesRes)) setRoles(rolesRes);
            else if (rolesRes?.data) setRoles(rolesRes.data);

        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        // Basic fetch implementation if api.getRoles doesn't exist in typed client yet
        const load = async () => {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const uRes = await fetch(import.meta.env.VITE_API_URL + '/users', { headers }).then(r => r.json());
            if (uRes.success) setUsers(uRes.data);

            const rRes = await fetch(import.meta.env.VITE_API_URL + '/roles', { headers }).then(r => r.json());
            if (Array.isArray(rRes)) setRoles(rRes);
        };
        load();
    }, []);

    const handleCreateRole = async () => {
        if (!newRoleName) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(import.meta.env.VITE_API_URL + '/roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name: newRoleName, permissions: [] })
            }).then(r => r.json());

            if (res.name) {
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
            const token = localStorage.getItem('token');
            await fetch(import.meta.env.VITE_API_URL + `/roles/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            setRoles(roles.filter(r => r._id !== id));
            toast({ title: "Role Deleted" });
        } catch (e) {
            toast({ title: "Error" });
        }
    };

    const handleUpdateUserRole = async (userId: string, newRole: string) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(import.meta.env.VITE_API_URL + `/users/${userId}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ role: newRole })
            });
            setUsers(users.map(u => u._id === userId ? { ...u, roles: [newRole] } : u));
            toast({ title: "User Updated", description: "Role assigned." });
        } catch (e) {
            toast({ title: "Error" });
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                {/* Manage Roles */}
                <Card className="bg-secondary/20 border-white/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Roles</CardTitle>
                        <CardDescription>Define access levels for the workspace.</CardDescription>
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
                    </CardContent>
                </Card>

                {/* Assign Roles */}
                <Card className="bg-secondary/20 border-white/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" /> User Assignments</CardTitle>
                        <CardDescription>Assign roles to team members.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                            {users.map(user => (
                                <div key={user._id} className="flex items-center justify-between p-2 bg-black/10 rounded-md border border-white/5">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                                            {user.name?.[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{user.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                    <Select
                                        value={user.roles?.[0] || 'member'}
                                        onValueChange={(val) => handleUpdateUserRole(user._id, val)}
                                    >
                                        <SelectTrigger className="w-[120px] h-8 text-xs bg-transparent border-white/10">
                                            <SelectValue>
                                                {user.roles && user.roles.length > 1
                                                    ? `${user.roles.length} Roles`
                                                    : (user.roles?.[0] || 'member')}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map(r => (
                                                <SelectItem key={r._id} value={r.name}>{r.name}</SelectItem>
                                            ))}
                                            <SelectItem value="member">member</SelectItem>
                                            <SelectItem value="admin">admin</SelectItem>
                                            <SelectItem value="owner">owner</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
