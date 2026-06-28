import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserPayload } from '../common/user.types';

@ApiTags('stores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'dealer')
  @ApiOperation({ summary: 'Create a new store (Admin/Dealer only)' })
  create(@Body() createStoreDto: CreateStoreDto, @CurrentUser() user: UserPayload) {
    return this.storesService.create(createStoreDto, user.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'List all stores for the current company' })
  findAll(@CurrentUser() user: UserPayload) {
    return this.storesService.findAll(user.tenantId);
  }

  @Post('switch/:id')
  @ApiOperation({ summary: 'Switch the logged-in user\'s active store' })
  switchStore(@Param('id') storeId: string, @CurrentUser() user: UserPayload) {
    return this.storesService.switchStore(user.id, storeId, user.tenantId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager', 'dealer')
  @ApiOperation({ summary: 'Get details of a specific store' })
  findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.storesService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'dealer')
  @ApiOperation({ summary: 'Update store details (Admin/Dealer only)' })
  update(
    @Param('id') id: string,
    @Body() updateStoreDto: UpdateStoreDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.storesService.update(id, updateStoreDto, user.tenantId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'dealer')
  @ApiOperation({ summary: 'Delete a store (Admin/Dealer only)' })
  remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.storesService.remove(id, user.tenantId);
  }
}
