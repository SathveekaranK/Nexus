"use client";

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useDispatch } from 'react-redux';
import { createChannel } from '@/services/channel/channelSlice';
import { AppDispatch } from '@/store/store';

interface NewChannelDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (channelName: string) => void;
}

export default function NewChannelDialog({ isOpen, onOpenChange, onSave }: NewChannelDialogProps) {
    const [name, setName] = useState('');
    const dispatch = useDispatch<AppDispatch>();

    const handleSave = async () => {
        if (name) {
            // Dispatch create action
            await dispatch(createChannel({ name, type: 'channel' }));

            // onSave might be used for UI closing or extra logic, keep it or just close
            onSave(name);
            setName('');
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Channel</DialogTitle>
                    <DialogDescription>
                        Channels are where your team communicates. They’re best when organized around a topic — #marketing, for example.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                            placeholder="# e.g. project-gamma"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button type="button" onClick={handleSave} disabled={!name.trim()}>
                        Create Channel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
