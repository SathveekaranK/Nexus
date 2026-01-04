// @ts-nocheck
import { Resource } from '@/lib/types';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { FileCode, Link as LinkIcon, FileText, Database, Copy, ExternalLink, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ResourceCardProps {
    resource: Resource;
    onDelete: (id: string) => void;
    isOwner: boolean;
}

export default function ResourceCard({ resource, onDelete, isOwner }: ResourceCardProps) {
    const { toast } = useToast();

    const getIcon = () => {
        switch (resource.type) {
            case 'snippet': return <FileCode className="h-5 w-5 text-yellow-400" />;
            case 'link': return <LinkIcon className="h-5 w-5 text-blue-400" />;
            case 'env': return <Database className="h-5 w-5 text-red-400" />;
            case 'doc': return <FileText className="h-5 w-5 text-green-400" />;
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(resource.content);
        toast({ title: "Copied!", description: "Content copied to clipboard." });
    };

    const handleOpen = () => {
        if (resource.type === 'link') {
            window.open(resource.content, '_blank');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
        >
            <Card className="p-4 bg-secondary/30 backdrop-blur-md border border-white/5 hover:border-primary/20 transition-all group h-full flex flex-col">
                <div className="flex bg-background/50 p-2 rounded-lg mb-3 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-black/20 rounded-md">
                            {getIcon()}
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm line-clamp-1">{resource.title}</h3>
                            <p className="text-[10px] text-muted-foreground">{new Date(resource.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 mb-4">
                    {resource.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{resource.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1">
                        {resource.tags.map(tag => (
                            <span key={tag} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full border border-primary/10">#{tag}</span>
                        ))}
                    </div>
                </div>

                {resource.type === 'snippet' && (
                    <div className="bg-black/40 p-2 rounded-md text-[10px] font-mono text-muted-foreground overflow-hidden h-16 mb-3 relative group">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
                        {resource.content}
                    </div>
                )}

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
                            <Copy className="h-3.5 w-3.5" />
                        </Button>
                        {resource.type === 'link' && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleOpen}>
                                <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>

                    {isOwner && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onDelete(resource._id)}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>
            </Card>
        </motion.div>
    );
}
