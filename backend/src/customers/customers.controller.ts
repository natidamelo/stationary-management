import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@ApiTags('customers')
@Controller('api/customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('dealer')
@ApiBearerAuth()
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'List all customers' })
  async findAll() {
    return this.customersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  async findOne(@Param('id') id: string) {
    return this.customersService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new customer' })
  async create(
    @Body()
    body: {
      name: string;
      email: string;
      contact?: string;
      address?: string;
      notes?: string;
    },
  ) {
    return this.customersService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update customer' })
  async update(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      name: string;
      email: string;
      contact: string;
      address: string;
      notes: string;
    }>,
  ) {
    return this.customersService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete customer' })
  async delete(@Param('id') id: string) {
    return this.customersService.delete(id);
  }
}
