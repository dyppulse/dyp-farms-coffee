import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { StoreService } from '../common/data/store.service';

@Controller('quality')
export class QualityController {
  constructor(private store: StoreService) {}

  @Post('scan')
  scanLot(@Body() body: { lotId?: string }) {
    const lot = body.lotId
      ? this.store.getLotById(body.lotId)
      : this.store.getLots()[0];

    const gradePoints: Record<string, number> = {
      'Grade A+': 92,
      'Grade A': 87,
      'Grade B': 78,
      'Grade C': 65,
    };

    return {
      id: `qc-${Date.now()}`,
      lotId: lot?.id,
      lotName: lot?.name,
      grade: lot?.grade ?? 'Grade A',
      points: gradePoints[lot?.grade ?? 'Grade A'] ?? 87,
      scannedAt: new Date().toISOString(),
      recommendations: [
        'Optimal moisture content detected',
        'No visible defects',
        'Consistent bean size',
      ],
    };
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
