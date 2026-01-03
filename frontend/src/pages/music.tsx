import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Music, PlusCircle, Users, MoreVertical, Trash2 } from 'lucide-react';
import { MUSIC_ROOMS as initialMusicRooms } from '@/lib/data';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function MusicPage() {
    const [musicRooms, setMusicRooms] = useState(initialMusicRooms);

    const handleDeleteRoom = (roomId: string) => {
        setMusicRooms(prevRooms => prevRooms.filter(room => room.id !== roomId));
    };

    return (
        <div className="h-full flex flex-col bg-background">
            <header className="flex items-center justify-between p-3 border-b border-border shadow-sm bg-secondary h-16 md:h-auto">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full">
                        <Music className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground">Music Rooms</h2>
                </div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Room
                </Button>
            </header>
            <div className="flex-1 p-4 md:p-6 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {musicRooms.map(room => (
                        <Card key={room.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="truncate">{room.name}</span>
                                    <div className="flex items-center">
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground mr-2">
                                            <Users className="h-4 w-4" />
                                            {room.participants.length}
                                        </div>
                                        <AlertDialog>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem className="text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete Room
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete the music room.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteRoom(room.id)}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </CardTitle>
                                <CardDescription>
                                    Now playing: <span className="font-medium text-foreground">{room.playlist[room.nowPlayingIndex].title}</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col justify-between">
                                <div className="flex -space-x-2 overflow-hidden mb-4">
                                    {room.participants.map(user => (
                                        <Avatar key={user.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
                                            <AvatarImage src={user?.avatarUrl} data-ai-hint="person portrait" />
                                            <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    ))}
                                </div>
                                <Link to={`/music/${room.id}`}>
                                    <Button className="w-full">
                                        <Music className="mr-2 h-4 w-4" />
                                        Join Room
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
