
import cron from 'node-cron';
import { User } from '../models/User';
import { Message } from '../models/Message';

export class DailyCleanup {
    static init() {
        // Schedule task at 3:00 AM every day
        cron.schedule('0 3 * * *', async () => {
            console.log('[DailyCleanup] Running 3:00 AM maintenance...');
            try {
                // Find Bot User
                const botUser = await User.findOne({ email: 'nexus@bot.com' });
                if (!botUser) {
                    console.log('[DailyCleanup] Bot user not found, skipping message cleanup.');
                    return;
                }

                const botId = botUser._id;

                // Delete messages where sender OR recipient is the bot
                const result = await Message.deleteMany({
                    $or: [
                        { senderId: botId },
                        { recipientId: botId }
                    ]
                });

                console.log(`[DailyCleanup] Deleted ${result.deletedCount} bot messages.`);
            } catch (error) {
                console.error('[DailyCleanup] Error executing cleanup:', error);
            }
        });

        console.log('[DailyCleanup] Task scheduled for 3:00 AM daily.');
    }
}
