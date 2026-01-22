"use client";

import { useState } from 'react';
import type { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, User as UserIcon, Lock, Palette, Upload, Smile, Moon, Sun, Monitor } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import RolesTab from './roles-tab';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { updateProfile } from '@/services/auth/authSlice';
import { Switch } from "@/components/ui/switch";
import { api } from '@/lib/api-client';

const getStatusClasses = (status: User['status']) => {
  switch (status) {
    case 'online': return 'bg-green-500';
    case 'offline': return 'bg-gray-400 border-background';
    case 'away': return 'bg-yellow-500';
    case 'dnd': return 'bg-red-500';
  }
}

interface SettingsViewProps {
  user: User;
}

export default function SettingsView({ user: initialUser }: SettingsViewProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [user, setUser] = useState(initialUser);
  const { toast } = useToast();

  const handleCancelEdit = () => {
    setUser(initialUser);
    setIsEditingProfile(false);
  }

  const handleSaveProfile = async () => {
    try {
      await dispatch(updateProfile({
        name: user.name,
        bio: user.bio,
        customStatus: user.customStatus,
        status: user.status
      })).unwrap();
      setIsEditingProfile(false);
      toast({ title: "Profile Updated", description: "Your profile has been saved." });
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const handlePreferenceChange = async (key: string, value: any) => {
    const newPreferences = { ...user.preferences, [key]: value };
    setUser({ ...user, preferences: newPreferences });

    try {
      await dispatch(updateProfile({ preferences: newPreferences })).unwrap();
      toast({ title: "Settings Saved" });
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to save setting" });
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const uploaded = await api.uploadFile(file);
      setUser({ ...user, avatar: uploaded.url }); // Optimistic
      await dispatch(updateProfile({ avatar: uploaded.url })).unwrap();
      toast({ title: "Avatar Updated" });
    } catch (err) {
      toast({ title: "Failed to upload avatar", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex items-center justify-between p-3 border-b border-border shadow-sm bg-secondary h-16 md:h-auto">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-foreground">Settings</h2>
        </div>
      </header>

      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-8">

          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserIcon className="h-5 w-5" /> My Profile</CardTitle>
              <CardDescription>Update your profile information and status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user.avatar} data-ai-hint="person portrait" />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute bottom-0 right-0 h-6 w-6 rounded-full border-4 border-card",
                    getStatusClasses(user.status)
                  )} />

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full cursor-pointer">
                    <Label htmlFor="avatar-upload" className="cursor-pointer">
                      <Upload className="h-6 w-6 text-white" />
                    </Label>
                    <Input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                  </div>
                </div>
                <div className="grid gap-1.5 flex-1 w-full">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={user.name}
                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                    disabled={!isEditingProfile}
                  />
                </div>
              </div>

              {/* Bio Field */}
              <div className="grid gap-1.5 w-full">
                <Label htmlFor="bio">About Me (Bio)</Label>
                <textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={user.bio || ''}
                  onChange={(e) => setUser({ ...user, bio: e.target.value })}
                  disabled={!isEditingProfile}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="grid gap-1.5 w-full">
                <Label htmlFor="customStatus">Custom Status</Label>
                <div className="relative">
                  <Input
                    id="customStatus"
                    placeholder="What's happening?"
                    value={user.customStatus || ''}
                    onChange={(e) => setUser({ ...user, customStatus: e.target.value })}
                    disabled={!isEditingProfile}
                    className="pr-8"
                  />
                  <Smile className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => isEditingProfile ? handleSaveProfile() : setIsEditingProfile(true)}>
                  {isEditingProfile ? "Save Changes" : "Edit Profile"}
                </Button>
                {isEditingProfile && (
                  <Button variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Account</CardTitle>
              <CardDescription>Manage your account settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue={`${user.name.toLowerCase().replace(' ', '.')}@nexus.com`} disabled />
              </div>
              <Button variant="outline">Change Password</Button>
            </CardContent>
          </Card>

          <Separator />

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</CardTitle>
              <CardDescription>Manage how you receive notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive push notifications for messages.</p>
                </div>
                <Switch
                  checked={user.preferences?.notifications ?? true}
                  onCheckedChange={(checked) => handlePreferenceChange('notifications', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Direct Messages Only</Label>
                  <p className="text-sm text-muted-foreground">Only notify me for DMs.</p>
                </div>
                <Switch disabled checked={false} />
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" /> Appearance</CardTitle>
              <CardDescription>Customize the look and feel of the app.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Label className="text-sm font-medium opacity-80">Theme Appearance</Label>
                <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-secondary/40 border border-white/5 shadow-inner">
                  {[
                    { id: 'light', icon: Sun, label: 'Light' },
                    { id: 'dark', icon: Moon, label: 'Dark' },
                    { id: 'system', icon: Monitor, label: 'System' }
                  ].map((t) => {
                    const isActive = (user.preferences?.theme || 'system') === t.id;
                    return (
                      <Button
                        key={t.id}
                        variant={isActive ? 'default' : 'ghost'}
                        size="sm"
                        className={cn(
                          "h-9 px-4 rounded-xl transition-all duration-300",
                          isActive ? "shadow-lg scale-105" : "text-muted-foreground hover:bg-white/5"
                        )}
                        onClick={() => handlePreferenceChange('theme', t.id as any)}
                      >
                        <t.icon className={cn("h-4 w-4", !isActive && "opacity-70")} />
                        <span className="ml-2 text-xs font-semibold">{t.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Roles & Permissions */}
          {(user.roles?.includes('admin') || user.roles?.includes('owner') || user.roles?.includes('member') || !user.roles || user.roles.length === 0) && (
            <>
              <Separator />
              <RolesTab />
            </>
          )}

        </div>
      </div>
    </div>
  );
}
