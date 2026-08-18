import { Injectable } from '@nestjs/common';
import { StoreService } from '../common/data/store.service';

export interface WarehouseReceipt {
  id: string;
  lotId: string;
  lotName: string;
  variety: string;
  quantity: number;
  unit: string;
  grade: string;
  moistureLevel: number;
  storageLocation: string;
  gpsLocation?: { lat: number; lng: number };
  qualityScore: number;
  estimatedValue: number;
  createdAt: string;
}

@Injectable()
export class ReceiptsService {
  constructor(private store: StoreService) {}

  generateReceiptFromQuality(lotId: string, qualityData: any): WarehouseReceipt {
    const lot = this.store.getLotById(lotId);
    if (!lot) throw new Error('Lot not found');

    const gradeScores = {
      'Grade A+': 95,
      'Grade A': 87,
      'Grade B': 78,
    };

    const qualityScore = gradeScores[lot.grade] || 75;
    const estimatedValue = lot.price * lot.quantity * (qualityScore / 100);

    return {
      id: `receipt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      lotId: lot.id,
      lotName: lot.name,
      variety: qualityData.variety || 'Unknown',
      quantity: lot.quantity,
      unit: lot.unit,
      grade: lot.grade,
      moistureLevel: qualityData.moistureLevel || 11.5,
      storageLocation: lot.warehouse || 'Warehouse A',
      gpsLocation: qualityData.gpsLocation,
      qualityScore,
      estimatedValue,
      createdAt: new Date().toISOString(),
    };
  }

  getReceiptById(receiptId: string): WarehouseReceipt | null {
    const receipts = this.store.getWarehouseReceipts?.() || [];
    return receipts.find((r) => r.id === receiptId) || null;
  }

  getUserReceipts(userId: string): WarehouseReceipt[] {
    const receipts = this.store.getWarehouseReceipts?.() || [];
    return receipts.filter((r) => r.createdAt).slice(0, 50);
  }

  shareReceipt(receiptId: string, format: 'pdf' | 'email' | 'link'): any {
    const receipt = this.getReceiptById(receiptId);
    if (!receipt) throw new Error('Receipt not found');

    const shareLink = `https://dyp-farms.app/receipts/${receiptId}`;
    return {
      receiptId,
      format,
      shareLink,
      timestamp: new Date().toISOString(),
      status: 'ready',
    };
  }
}
