"use client";

import { useState } from 'react';
import type { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, User as UserIcon, Lock, Palette, Upload, Smile } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [user, setUser] = useState(initialUser);
  const { toast } = useToast();

  const handleProfileEditToggle = () => {
    if (isEditingProfile) {
      // In a real app, this would be an API call
      // For now, we just update the local state which doesn't persist.
      toast({
        title: "Profile Updated",
        description: "Your changes have been saved.",
      });
    }
    setIsEditingProfile(!isEditingProfile);
  };

  const handleCancelEdit = () => {
    setUser(initialUser);
    setIsEditingProfile(false);
  }

  const handleStatusChange = (status: User['status']) => {
    setUser({...user, status});
    // In a real app, this would also be an API call.
     toast({
        title: "Status Updated",
        description: `Your status is now ${status}.`,
      });
  }

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
              <CardTitle className="flex items-center gap-2"><UserIcon className="h-5 w-5"/> My Profile</CardTitle>
              <CardDescription>Update your profile information and status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={user.avatarUrl} data-ai-hint="person portrait" />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                         <div className={cn(
                            "absolute bottom-0 right-0 h-6 w-6 rounded-full border-4 border-card cursor-pointer",
                            getStatusClasses(user.status)
                          )} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                          <DropdownMenuItem onSelect={() => handleStatusChange('online')}>Online</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleStatusChange('away')}>Away</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleStatusChange('dnd')}>Do Not Disturb</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleStatusChange('offline')}>Offline</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                  {isEditingProfile && (
                    <Button size="icon" className="absolute -top-2 -left-2 h-7 w-7 rounded-full">
                      <Upload className="h-4 w-4" />
                      <Input type="file" className="sr-only" />
                    </Button>
                  )}
                </div>
                <div className="grid gap-1.5 flex-1 w-full">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      value={user.name} 
                      onChange={(e) => setUser({...user, name: e.target.value})}
                      disabled={!isEditingProfile} 
                    />
                </div>
              </div>
               <div className="grid gap-1.5 w-full">
                  <Label htmlFor="customStatus">Custom Status</Label>
                  <div className="relative">
                    <Input 
                      id="customStatus"
                      placeholder="What's happening?"
                      value={user.customStatus || ''} 
                      onChange={(e) => setUser({...user, customStatus: e.target.value})}
                      disabled={!isEditingProfile}
                      className="pr-8"
                    />
                    <Smile className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleProfileEditToggle}>
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
              <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5"/> Account</CardTitle>
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
              <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5"/> Notifications</CardTitle>
              <CardDescription>Manage how you receive notifications.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Notification settings are coming soon.</p>
            </CardContent>
          </Card>

           <Separator />
          
          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5"/> Appearance</CardTitle>
              <CardDescription>Customize the look and feel of the app.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Theme customization is coming soon.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
