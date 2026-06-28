import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { PurchaseRequestsService } from './purchase-requests.service';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserPayload } from '../common/user.types';
import { RoleEnum } from '../common/enums';
import { RequestStatus } from '../common/enums';

@ApiTags('purchase-requests')
@ApiBearerAuth()
@Controller('api/purchase-requests')
@UseGuards(JwtAuthGuard)
export class PurchaseRequestsController {
  constructor(private requests: PurchaseRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new purchase requisition' })
  create(@Body() dto: CreatePurchaseRequestDto, @CurrentUser() user: UserPayload) {
    return this.requests.create(dto, user);
  }

  @Get('my')
  @ApiOperation({ summary: 'List user\'s own purchase requisitions' })
  myRequests(@CurrentUser() user: UserPayload, @Query('storeId') storeId?: string) {
    return this.requests.findAll(user.tenantId, { requestedBy: user.id, storeId });
  }

  @Get()
  @ApiOperation({ summary: 'List all purchase requisitions' })
  list(
    @CurrentUser() user: UserPayload,
    @Query('status') status?: RequestStatus,
    @Query('storeId') storeId?: string,
  ) {
    return this.requests.findAll(user.tenantId, { status, storeId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a purchase requisition' })
  get(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.requests.findOne(id, user.tenantId);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit a draft purchase requisition' })
  submit(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.requests.submit(id, user);
  }

  @Post(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.MANAGER)
  @ApiOperation({ summary: 'Approve a pending purchase requisition (Admin/Manager only)' })
  approve(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.requests.approve(id, user);
  }

  @Post(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.MANAGER)
  @ApiOperation({ summary: 'Reject a pending purchase requisition (Admin/Manager only)' })
  reject(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser() user: UserPayload,
  ) {
    return this.requests.reject(id, user, body.reason || 'Rejected');
  }
}
