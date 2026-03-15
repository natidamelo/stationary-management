import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsMongoId, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePurchaseRequestLineDto {
  @ApiProperty({ description: 'Item ID (MongoDB ObjectId)' })
  @IsMongoId()
  itemId: string;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreatePurchaseRequestDto {
  @ApiProperty({ type: [CreatePurchaseRequestLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseRequestLineDto)
  lines: CreatePurchaseRequestLineDto[];
}
