// @ts-nocheck
import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Resource } from '@/lib/types';
import ResourceCard from '@/components/resources/resource-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Filter, Database, Link, FileText, FileCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import NotificationBell from '@/components/notifications/notification-bell';

export default function ResourcesPage() {
    const [resources, setResources] = useState<Resource[]>([]);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState<string | 'all'>('all');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const { toast } = useToast();
    const currentUser = useSelector((state: RootState) => state.auth.user);

    // New Resource Form State
    const [newTitle, setNewTitle] = useState('');
    const [newType, setNewType] = useState('link');
    const [newContent, setNewContent] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newTags, setNewTags] = useState('');

    const fetchResources = async () => {
        try {
            const data = await api.getResources();
            if (data.success) {
                setResources(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch resources", error);
        }
    };

    useEffect(() => {
        fetchResources();
    }, []);

    const handleCreate = async () => {
        if (!newTitle || !newContent) return;
        try {
            const tagsArray = newTags.split(',').map(t => t.trim()).filter(Boolean);
            const res = await api.createResource({
                title: newTitle,
                type: newType,
                content: newContent,
                description: newDesc,
                tags: tagsArray
            });
            if (res.success) {
                toast({ title: "Resource Added", description: "Successfully added to library." });
                setIsCreateOpen(false);
                fetchResources();
                // Reset form
                setNewTitle('');
                setNewContent('');
                setNewDesc('');
                setNewTags('');
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to create resource.", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await api.deleteResource(id);
            if (res.success) {
                toast({ title: "Deleted", description: "Resource removed." });
                setResources(prev => prev.filter(r => r._id !== id));
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete resource.", variant: "destructive" });
        }
    };

    const filteredResources = resources.filter(r => {
        const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
            r.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
        const matchesType = activeFilter === 'all' || r.type === activeFilter;
        return matchesSearch && matchesType;
    });

    const filters = [
        { id: 'all', label: 'All', icon: Filter },
        { id: 'snippet', label: 'Snippets', icon: FileCode },
        { id: 'link', label: 'Links', icon: Link },
        { id: 'env', label: 'Env Vars', icon: Database },
        { id: 'doc', label: 'Docs', icon: FileText },
    ];

    return (
        <div className="flex-1 h-full flex flex-col bg-background/50 overflow-hidden relative">
            {/* Background Decoration */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />

            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0 z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Team Library</h1>
                        <p className="text-sm text-muted-foreground">Central hub for code snippets, environment links, and documentation.</p>
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                                <Plus className="mr-2 h-4 w-4" /> Add Resource
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] bg-[#1a1b26]/95 border-white/10 text-white">
                            <DialogHeader>
                                <DialogTitle>Add New Resource</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Title</Label>
                                    <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g., Prod Database URL" className="bg-black/20 border-white/10" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Type</Label>
                                    <Select value={newType} onValueChange={setNewType}>
                                        <SelectTrigger className="bg-black/20 border-white/10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="link">Link</SelectItem>
                                            <SelectItem value="snippet">Snippet</SelectItem>
                                            <SelectItem value="env">Environment Var</SelectItem>
                                            <SelectItem value="doc">Documentation</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Content</Label>
                                    <Textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="URL or Code..." className="bg-black/20 border-white/10 font-mono text-xs" rows={5} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Description (Optional)</Label>
                                    <Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Short description..." className="bg-black/20 border-white/10" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Tags (Optional)</Label>
                                    <Input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="react, deploy, aws (comma separated)" className="bg-black/20 border-white/10" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreate}>Create Resource</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    {/* Search */}
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground mr-2" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search library..."
                            className="pl-9 bg-black/20 border-white/5 focus:bg-black/40 transition-colors"
                        />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex bg-secondary/30 p-1 rounded-lg border border-white/5 overflow-x-auto w-full md:w-auto">
                        {filters.map(filter => (
                            <button
                                key={filter.id}
                                onClick={() => setActiveFilter(filter.id)}
                                className={`
                                    flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap
                                    ${activeFilter === filter.id
                                        ? 'bg-primary/20 text-primary shadow-sm'
                                        : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}
                                `}
                            >
                                <filter.icon className="h-3.5 w-3.5" />
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    <div className="md:ml-auto">
                        <NotificationBell />
                    </div>
                </div>
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    <AnimatePresence>
                        {filteredResources.map((resource) => (
                            <ResourceCard
                                key={resource._id}
                                resource={resource}
                                onDelete={handleDelete}
                                isOwner={currentUser?.id === resource.createdBy._id || currentUser?.id === resource.createdBy}
                            />
                        ))}
                    </AnimatePresence>

                    {filteredResources.length === 0 && (
                        <div className="col-span-full h-64 flex flex-col items-center justify-center text-muted-foreground">
                            <Database className="h-12 w-12 mb-4 opacity-20" />
                            <p>No resources found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
