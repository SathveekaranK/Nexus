'use client';

import type { User } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Video, MessageSquare, CircleSlash, Camera, Edit2, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { CHANNELS } from '@/lib/data';
import { RoleBadges } from '../ui/role-badges';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { updateProfile } from '@/services/auth/authSlice'; // Fixed Import
import { api } from '@/lib/api-client';
import { useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

interface UserProfileDialogProps {
  user: User;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function UserProfileDialog({
  user,
  isOpen,
  onOpenChange,
}: UserProfileDialogProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isOwnProfile = currentUser?.id === user.id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState(user.bio || '');
  const [editStatus, setEditStatus] = useState(user.customStatus || '');

  const handleSaveProfile = async () => {
    try {
      await dispatch(updateProfile({ bio: editBio, customStatus: editStatus })).unwrap();
      setIsEditing(false);
      toast({ title: "Profile updated!" });
    } catch (err) {
      toast({ title: "Failed to update profile", variant: "destructive" });
    }
  };

  const handleAvatarClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploaded = await api.uploadFile(file);
      await dispatch(updateProfile({ avatar: uploaded.url })).unwrap();
      toast({ title: "Avatar updated successfully" });
    } catch (err) {
      toast({ title: "Failed to update avatar", variant: "destructive" });
    }
  };

  const handleSendMessage = () => {
    const existingDm = CHANNELS.find(
      (c) =>
        c.type === 'dm' &&
        c.memberIds?.includes('user-1') &&
        c.memberIds?.includes(user.id)
    );

    if (existingDm) {
      navigate(`/dms/${existingDm.id}`);
    } else {
      // DM creation logic handled by backend
    }
    onOpenChange(false);
  };

  const getStatusDisplay = (status: User['status']) => {
    switch (status) {
      case 'online': return { text: 'Online', icon: null, color: 'bg-green-500' };
      case 'offline': return { text: 'Offline', icon: null, color: 'bg-gray-400' };
      case 'away': return { text: 'Away', icon: null, color: 'bg-yellow-500' };
      case 'dnd': return { text: 'Do Not Disturb', icon: <CircleSlash className="h-3 w-3" />, color: 'bg-red-500' };
    }
  }

  const statusDisplay = getStatusDisplay(user.status);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="items-center text-center">
          {isOwnProfile && !isEditing && (
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-white" onClick={() => { setIsEditing(true); setEditBio(user.bio || ''); setEditStatus(user.customStatus || ''); }} title="Edit profile">
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          {isOwnProfile && isEditing && (
            <div className="absolute top-2 right-2 flex gap-1">
              <Button variant="ghost" size="icon" className="text-red-400 hover:bg-red-900/20" onClick={() => setIsEditing(false)} title="Cancel editing">
                <X className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-green-400 hover:bg-green-900/20" onClick={handleSaveProfile} title="Save changes">
                <Save className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="relative w-24 h-24 mb-2 group">
            <Avatar className={cn("h-24 w-24", isEditing && "cursor-pointer group-hover:opacity-80 transition-opacity ring-2 ring-primary")} onClick={handleAvatarClick} title={isEditing ? "Click to change avatar" : undefined}>
              <AvatarImage src={user.avatar} data-ai-hint="person portrait" />
              <AvatarFallback className="text-3xl">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <Camera className="h-8 w-8 text-white drop-shadow-lg" />
              </div>
            )}
            <div className={cn("absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-background", statusDisplay.color)} />
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>
          <div className="flex flex-col items-center gap-2">
            <DialogTitle className="text-2xl">{user.name}</DialogTitle>
            <RoleBadges roles={user.roles} />
          </div>

          {isEditing ? (
            <Input
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              placeholder="Set a custom status..."
              title="Custom status"
              className="text-center h-8 bg-black/20 border-white/10"
            />
          ) : (
            user.customStatus && <DialogDescription>{user.customStatus}</DialogDescription>
          )}

          <DialogDescription className="capitalize flex items-center gap-2 mt-1">
            <span className={cn('h-2 w-2 rounded-full', statusDisplay.color)} />
            {statusDisplay.icon}
            {statusDisplay.text}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {isEditing ? (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase">Bio</h4>
              <Textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Write something about yourself..."
                title="Bio"
                className="bg-black/20 border-white/10 min-h-[80px]"
              />
            </div>
          ) : (
            user.bio && (
              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">About</h4>
                <p className="text-sm italic text-white/90">{user.bio}</p>
              </div>
            )
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Contact Information</h3>
            <p className="text-sm flex items-center gap-2">
              <span className="text-muted-foreground">Email:</span>
              {user.email || `${user.name.toLowerCase().replace(' ', '.')}@nexus.com`}
            </p>
            <p className="text-sm flex items-center gap-2">
              <span className="text-muted-foreground">Status:</span>
              <span className={cn("text-xs px-2 py-0.5 rounded-full border",
                user.status === 'online' ? "bg-green-500/10 border-green-500/20 text-green-400" :
                  user.status === 'dnd' ? "bg-red-500/10 border-red-500/20 text-red-400" :
                    "bg-gray-500/10 border-gray-500/20 text-gray-400"
              )}>
                {statusDisplay.text}
              </span>
            </p>
          </div>
        </div>
        <div className="flex justify-center gap-2">
          <Button onClick={handleSendMessage} title="Send message">
            <MessageSquare className="mr-2" />
            Message
          </Button>
          <Button variant="outline" title="Start video call">
            <Video className="mr-2" />
            Call
          </Button>
        </div>


      </DialogContent>
    </Dialog>
  );
}
