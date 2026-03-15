import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotificationDocument } from '../schemas/notification.schema';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectModel(NotificationDocument.name)
        private notifModel: Model<NotificationDocument>,
    ) { }

    async create(data: {
        title: string;
        message: string;
        type: string;
        userId?: string;
        link?: string;
    }) {
        return this.notifModel.create({
            title: data.title,
            message: data.message,
            type: data.type,
            userId: data.userId ? new Types.ObjectId(data.userId) : undefined,
            link: data.link,
        });
    }

    async broadcast(data: { title: string; message: string; type: string; link?: string }) {
        return this.notifModel.create({
            title: data.title,
            message: data.message,
            type: data.type,
            link: data.link,
        });
    }

    /** Get notifications for a specific user (their own + broadcast) */
    async getForUser(userId: string, limit = 50) {
        const userObjId = new Types.ObjectId(userId);
        return this.notifModel
            .find({ $or: [{ userId: userObjId }, { userId: null }, { userId: { $exists: false } }] })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
    }

    async getUnreadCount(userId: string): Promise<number> {
        const userObjId = new Types.ObjectId(userId);
        return this.notifModel.countDocuments({
            isRead: false,
            $or: [{ userId: userObjId }, { userId: null }, { userId: { $exists: false } }],
        });
    }

    async markRead(id: string) {
        return this.notifModel.findByIdAndUpdate(id, { isRead: true }, { new: true });
    }

    async markAllRead(userId: string) {
        const userObjId = new Types.ObjectId(userId);
        return this.notifModel.updateMany(
            {
                isRead: false,
                $or: [{ userId: userObjId }, { userId: null }, { userId: { $exists: false } }],
            },
            { isRead: true },
        );
    }

    async deleteOne(id: string) {
        return this.notifModel.findByIdAndDelete(id);
    }

    async clearAll(userId: string) {
        const userObjId = new Types.ObjectId(userId);
        return this.notifModel.deleteMany({
            $or: [{ userId: userObjId }, { userId: null }, { userId: { $exists: false } }],
        });
    }
}
