import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, WarehouseReceipt as DbReceipt } from '@prisma/client';
import { StoreService } from '../common/data/store.service';
import { PrismaService } from '../prisma/prisma.service';

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
  constructor(
    private store: StoreService,
    private prisma: PrismaService,
  ) {}

  private toReceipt(r: DbReceipt): WarehouseReceipt {
    return {
      id: r.id,
      lotId: r.lotId,
      lotName: r.lotName,
      variety: r.variety,
      quantity: r.quantity,
      unit: r.unit,
      grade: r.grade,
      moistureLevel: r.moistureLevel,
      storageLocation: r.storageLocation,
      gpsLocation: (r.gpsLocation as WarehouseReceipt['gpsLocation']) ?? undefined,
      qualityScore: r.qualityScore,
      estimatedValue: r.estimatedValue,
      createdAt: r.createdAt.toISOString(),
    };
  }

  /** Creates and stores a receipt for `lotId`. Only the lot's farmer (or an admin) may do so. */
  async generateReceiptFromQuality(
    actor: { id: string; role?: string },
    lotId: string,
    qualityData: any,
  ): Promise<WarehouseReceipt> {
    const lot = await this.store.getLotById(lotId);
    if (!lot) throw new NotFoundException('Lot not found');
    if (actor.role !== 'admin' && lot.farmerId !== actor.id) {
      throw new ForbiddenException('You can only issue receipts for your own lots');
    }

    const gradeScores: Record<string, number> = {
      'Grade A+': 95,
      'Grade A': 87,
      'Grade B': 78,
    };

    const qualityScore = gradeScores[lot.grade] || 75;
    const estimatedValue = lot.price * lot.quantity * (qualityScore / 100);
    const gps = qualityData?.gpsLocation;

    const created = await this.prisma.warehouseReceipt.create({
      data: {
        userId: actor.id,
        lotId: lot.id,
        lotName: lot.name,
        variety: qualityData?.variety || 'Unknown',
        quantity: lot.quantity,
        unit: lot.unit,
        grade: lot.grade,
        moistureLevel: qualityData?.moistureLevel || 11.5,
        storageLocation: lot.warehouse || 'Warehouse A',
        gpsLocation: gps ? (gps as Prisma.InputJsonValue) : undefined,
        qualityScore,
        estimatedValue,
      },
    });
    return this.toReceipt(created);
  }

  /** Returns the receipt only if it belongs to `userId`; otherwise null. */
  async getReceiptById(
    userId: string,
    receiptId: string,
  ): Promise<WarehouseReceipt | null> {
    const r = await this.prisma.warehouseReceipt.findFirst({
      where: { id: receiptId, userId },
    });
    return r ? this.toReceipt(r) : null;
  }

  async getUserReceipts(userId: string): Promise<WarehouseReceipt[]> {
    const rows = await this.prisma.warehouseReceipt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return rows.map((r) => this.toReceipt(r));
  }

  async shareReceipt(
    userId: string,
    receiptId: string,
    format: 'pdf' | 'email' | 'link',
  ) {
    const receipt = await this.getReceiptById(userId, receiptId);
    if (!receipt) throw new NotFoundException('Receipt not found');

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
