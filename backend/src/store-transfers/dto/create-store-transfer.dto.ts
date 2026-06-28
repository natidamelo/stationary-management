import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

class TransferLineDto {
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateStoreTransferDto {
  @IsString()
  @IsNotEmpty()
  fromStoreId: string;

  @IsString()
  @IsNotEmpty()
  toStoreId: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferLineDto)
  lines: TransferLineDto[];
}
