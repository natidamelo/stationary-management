import { Controller, Get, Post, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private notifService: NotificationsService) { }

    @Get()
    getAll(@Req() req: any) {
        return this.notifService.getForUser(req.user.userId);
    }

    @Get('unread-count')
    unreadCount(@Req() req: any) {
        return this.notifService.getUnreadCount(req.user.userId).then((count) => ({ count }));
    }

    @Post(':id/read')
    markRead(@Param('id') id: string) {
        return this.notifService.markRead(id);
    }

    @Post('mark-all-read')
    markAllRead(@Req() req: any) {
        return this.notifService.markAllRead(req.user.userId);
    }

    @Delete(':id')
    deleteOne(@Param('id') id: string) {
        return this.notifService.deleteOne(id);
    }

    @Delete()
    clearAll(@Req() req: any) {
        return this.notifService.clearAll(req.user.userId);
    }
}
