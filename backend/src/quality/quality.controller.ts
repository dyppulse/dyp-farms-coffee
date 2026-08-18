import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StoreService } from '../common/data/store.service';
import { QualityService } from './quality.service';

@Controller('quality')
export class QualityController {
  constructor(
    private quality: QualityService,
    private store: StoreService,
  ) {}

  /**
   * Multipart scan: field "image" (required) + optional lotId, variety, moistureNote.
   * FUTURE: swap QualityService provider for paid vision API or custom trained model.
   */
  @Post('scan')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  async scanLot(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body()
    body: { lotId?: string; variety?: string; moistureNote?: string },
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException(
        'Image is required. Capture coffee beans with the camera and upload field "image".',
      );
    }

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (file.mimetype && !allowed.includes(file.mimetype)) {
      throw new BadRequestException(
        'Unsupported image type. Use JPEG, PNG, or WebP.',
      );
    }

    return this.quality.analyzeImage({
      buffer: file.buffer,
      mimeType: file.mimetype || 'image/jpeg',
      lotId: body.lotId,
      variety: body.variety,
      moistureNote: body.moistureNote,
    });
  }

  @Get(':lotId')
  getQualityCheck(@Param('lotId') lotId: string) {
    const lot = this.store.getLotById(lotId);
    if (!lot) return { error: 'Lot not found' };
    return {
      lotId: lot.id,
      lotName: lot.name,
      grade: lot.grade,
      points: lot.grade === 'Grade A+' ? 92 : lot.grade === 'Grade A' ? 87 : 78,
    };
  }
}
