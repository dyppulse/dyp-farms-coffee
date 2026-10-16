import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { JwtAuthGuard } from '../auth/auth.guard';
import { SendMessageDto, StartChatDto } from '../ai/dto/ai.dto';
import { CalculateFootprintDto } from '../carbon/dto/carbon.dto';
import { LogisticsController } from '../logistics/logistics.controller';
import { QualityController } from '../quality/quality.controller';
import { GenerateReceiptDto, ShareReceiptDto } from '../receipts/dto/receipts.dto';
import { ApproveWithdrawalDto } from '../wallet/dto/wallet.dto';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, PageQueryDto, toPage } from './pagination';

const errorsFor = async (cls: new () => object, plain: object) =>
  (await validate(plainToInstance(cls, plain), { whitelist: true, forbidNonWhitelisted: false })).map(
    (e) => e.property,
  );

describe('login required', () => {
  it.each([
    ['QualityController', QualityController],
    ['LogisticsController', LogisticsController],
  ])('%s is behind JwtAuthGuard', (_name, controller) => {
    const guards: unknown[] = Reflect.getMetadata('__guards__', controller) ?? [];
    expect(guards).toContain(JwtAuthGuard);
  });
});

describe('request body validation', () => {
  it('rejects a receipt with a bad GPS location or missing lot', async () => {
    expect(await errorsFor(GenerateReceiptDto, {})).toContain('lotId');
    expect(
      await errorsFor(GenerateReceiptDto, { lotId: 'l1', qualityData: { gpsLocation: { lat: 999, lng: 0 } } }),
    ).toContain('qualityData');
    expect(await errorsFor(GenerateReceiptDto, { lotId: 'l1', qualityData: { variety: 'SL28' } })).toEqual([]);
  });

  it('only accepts the known share formats', async () => {
    expect(await errorsFor(ShareReceiptDto, { format: 'fax' })).toContain('format');
    expect(await errorsFor(ShareReceiptDto, { format: 'pdf' })).toEqual([]);
  });

  it('rejects non-numeric or absurd carbon inputs', async () => {
    const base = { batchSize: 100, distance: 500, transportMode: 'sea', origin: 'Uganda', certifications: [] };
    expect(await errorsFor(CalculateFootprintDto, base)).toEqual([]);
    expect(await errorsFor(CalculateFootprintDto, { ...base, batchSize: 'lots' })).toContain('batchSize');
    expect(await errorsFor(CalculateFootprintDto, { ...base, transportMode: 'teleport' })).toContain('transportMode');
    expect(await errorsFor(CalculateFootprintDto, { ...base, distance: -5 })).toContain('distance');
  });

  it('limits chat messages and conversation ids', async () => {
    expect(await errorsFor(SendMessageDto, { message: '' })).toContain('message');
    expect(await errorsFor(SendMessageDto, { message: 'x'.repeat(2001) })).toContain('message');
    expect(await errorsFor(StartChatDto, { conversationId: '../etc/passwd' })).toContain('conversationId');
    expect(await errorsFor(StartChatDto, { conversationId: 'conv-123_a' })).toEqual([]);
  });

  it('keeps the withdrawal payout reference short', async () => {
    expect(await errorsFor(ApproveWithdrawalDto, { payoutReference: 'x'.repeat(121) })).toContain('payoutReference');
    expect(await errorsFor(ApproveWithdrawalDto, {})).toEqual([]);
  });
});

describe('pagination', () => {
  it('caps every list even when no query is sent', () => {
    expect(toPage()).toEqual({ take: DEFAULT_PAGE_SIZE, skip: 0 });
    expect(toPage(undefined, 200)).toEqual({ take: 200, skip: 0 });
  });

  it('honours limit and offset', () => {
    expect(toPage({ limit: 10, offset: 30 })).toEqual({ take: 10, skip: 30 });
  });

  it('rejects limits above the maximum, zero, and negative offsets', async () => {
    expect(await errorsFor(PageQueryDto, { limit: String(MAX_PAGE_SIZE + 1) })).toContain('limit');
    expect(await errorsFor(PageQueryDto, { limit: '0' })).toContain('limit');
    expect(await errorsFor(PageQueryDto, { offset: '-1' })).toContain('offset');
    expect(await errorsFor(PageQueryDto, { limit: '25', offset: '50' })).toEqual([]);
  });
});
