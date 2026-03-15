import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLogDocument } from '../schemas/audit-log.schema';

@Injectable()
export class AuditLogService {
    constructor(
        @InjectModel(AuditLogDocument.name)
        private auditModel: Model<AuditLogDocument>,
    ) { }

    async log(data: {
        action: string;
        entity: string;
        entityId?: string;
        changes?: Record<string, any>;
        performedById?: string;
        performedByName?: string;
    }) {
        try {
            await this.auditModel.create({
                action: data.action,
                entity: data.entity,
                entityId: data.entityId,
                changes: data.changes,
                performedById: data.performedById ? new Types.ObjectId(data.performedById) : undefined,
                performedByName: data.performedByName,
            });
        } catch {
            // Non-critical: never let audit log failures break business logic
        }
    }

    async findAll(options?: { entity?: string; limit?: number; skip?: number }) {
        const filter: Record<string, any> = {};
        if (options?.entity) filter.entity = options.entity;
        const total = await this.auditModel.countDocuments(filter);
        const logs = await this.auditModel
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(options?.skip ?? 0)
            .limit(options?.limit ?? 100)
            .lean();
        return { logs, total };
    }

    async clearOld(daysOld = 90) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysOld);
        return this.auditModel.deleteMany({ createdAt: { $lt: cutoff } });
    }
}
