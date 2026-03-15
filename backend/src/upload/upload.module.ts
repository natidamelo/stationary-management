import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AttachmentDocument, AttachmentSchema } from '../schemas/attachment.schema';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AttachmentDocument.name, schema: AttachmentSchema }]),
    MulterModule.registerAsync({
      useFactory: (config: ConfigService) => {
        const dest = config.get<string>('upload.dest') || './uploads';
        if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
        return {
          storage: diskStorage({
            destination: dest,
            filename: (_, file, cb) => {
              const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
              cb(null, name + extname(file.originalname) || '');
            },
          }),
          limits: {
            fileSize: config.get<number>('upload.maxSize') || 5 * 1024 * 1024,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [UploadService],
  controllers: [UploadController],
  exports: [UploadService],
})
export class UploadModule {}
