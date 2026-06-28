import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StoreTransfersService } from './store-transfers.service';
import { CreateStoreTransferDto } from './dto/create-store-transfer.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserPayload } from '../common/user.types';
import { RoleEnum } from '../common/enums';

@ApiTags('store-transfers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/store-transfers')
export class StoreTransfersController {
  constructor(private readonly transfersService: StoreTransfersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new pending store transfer' })
  create(
    @Body() createDto: CreateStoreTransferDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.transfersService.create(createDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List all store transfers for the company' })
  findAll(@CurrentUser() user: UserPayload) {
    return this.transfersService.findAll(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a store transfer' })
  findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.transfersService.findOne(id, user.tenantId);
  }

  @Post(':id/complete')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DEALER)
  @ApiOperation({ summary: 'Approve and complete a pending store transfer (Admin/Manager/Dealer only)' })
  complete(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.transfersService.complete(id, user);
  }
}
