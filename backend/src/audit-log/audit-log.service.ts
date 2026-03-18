import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLogDocument } from '../schemas/audit-log.schema';
import { toObjectId } from '../common/utils';

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
        tenantId?: string;
    }) {
        try {
            const cleanTenantId = (data.tenantId || '').trim();
            const tid = toObjectId(cleanTenantId);
            await this.auditModel.create({
                action: data.action,
                entity: data.entity,
                entityId: data.entityId,
                changes: data.changes,
                performedById: toObjectId(data.performedById) || undefined,
                performedByName: data.performedByName,
                tenantId: tid || cleanTenantId || undefined,
            });
        } catch {
            // Non-critical: never let audit log failures break business logic
        }
    }

    async findAll(tenantId: string, options?: { entity?: string; limit?: number; skip?: number }) {
        const cleanTenantId = (tenantId || '').trim();
        const tid = toObjectId(cleanTenantId);
        if (!tid && !cleanTenantId) return { logs: [], total: 0 };
        
        const filter: any = { $or: [{ tenantId: tid }, { tenantId: cleanTenantId }] };
        if (options?.entity) filter.entity = options.entity;
        
        const [logs, total] = await Promise.all([
            this.auditModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(options?.skip ?? 0)
                .limit(options?.limit ?? 100)
                .lean(),
            this.auditModel.countDocuments(filter),
        ]);
        
        return { logs, total };
    }

    async clearOld(daysOld = 90) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysOld);
        return this.auditModel.deleteMany({ createdAt: { $lt: cutoff } });
    }
}
