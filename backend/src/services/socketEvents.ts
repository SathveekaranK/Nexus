import { EventEmitter } from 'events';

class SocketEventEmitter extends EventEmitter { }

export const socketEvents = new SocketEventEmitter();
