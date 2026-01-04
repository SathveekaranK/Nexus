import { Server, Socket } from 'socket.io';
import { Room } from '../models/Room';

export const roomSocketHandler = (io: Server) => {
    io.on('connection', (socket: Socket) => {

        socket.on('join_room', async ({ roomId, userId, peerId }) => {
            try {
                socket.join(roomId);
                console.log(`User ${userId} joined room ${roomId} with peerId ${peerId}`);

                // Update room members
                const room = await Room.findOneAndUpdate(
                    { roomId },
                    { $addToSet: { members: userId } },
                    { new: true }
                );

                // Broadcast to others in room
                socket.to(roomId).emit('user_connected', peerId);

                // Send current room state (media) to the joining user
                if (room && room.currentMedia) {
                    socket.emit('sync_media', room.currentMedia);
                }
            } catch (error) {
                console.error('Join room error:', error);
            }
        });

        socket.on('leave_room', async ({ roomId, userId, peerId }) => {
            try {
                socket.leave(roomId);
                const room = await Room.findOneAndUpdate(
                    { roomId },
                    { $pull: { members: userId } },
                    { new: true } // Return updated doc
                );

                socket.to(roomId).emit('user_disconnected', peerId);

                // Auto-delete if empty
                if (room && room.members.length === 0) {
                    await Room.deleteOne({ roomId });
                    console.log(`Room ${roomId} deleted as it is now empty.`);
                    // Optional: Emit to lobby to refresh list (if lobby listens to a global event)
                    // io.emit('room_deleted', roomId); 
                }

            } catch (error) {
                console.error('Leave room error:', error);
            }
        });

        // --- Generic Media Handlers (YouTube) ---

        socket.on('play_media', async ({ roomId, media }) => {
            // Play for everyone
            const now = Date.now();
            const updatedMedia = {
                ...media,
                isPlaying: true,
                playedAt: now // timestamp when play started, helps sync
            };

            // Persist
            await Room.findOneAndUpdate({ roomId }, { currentMedia: updatedMedia });

            io.to(roomId).emit('media_state_changed', updatedMedia);
        });

        socket.on('pause_media', async ({ roomId, media }) => {
            const updatedMedia = {
                ...media,
                isPlaying: false
            };

            await Room.findOneAndUpdate({ roomId }, { currentMedia: updatedMedia });
            io.to(roomId).emit('media_state_changed', updatedMedia);
        });

        socket.on('seek_media', async ({ roomId, timestamp, media }) => {
            const updatedMedia = {
                ...media,
                timestamp: timestamp, // current seconds
                playedAt: Date.now() // reset sync time
            };

            await Room.findOneAndUpdate({ roomId }, { currentMedia: updatedMedia });
            io.to(roomId).emit('media_seeked', updatedMedia);
        });

        // --- Voice Chat Signaling ---
        socket.on('join-voice', (roomId, peerId) => {
            socket.join(roomId);
            socket.to(roomId).emit('user-connected', peerId);
        });

        socket.on('disconnect', () => {
            // Cleanup if needed
        });
    });
};
