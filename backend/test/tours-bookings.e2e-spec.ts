import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Tours & Bookings (e2e)', () => {
  let app: INestApplication<App>;
  let authToken: string;
  let tourId: string;
  let slotId: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.PAYMENTS_MOCK = 'true';
    process.env.JWT_SECRET = 'test-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'buyer@dypfarms.com', password: 'password123' });

    authToken = login.body.accessToken;

    const tours = await request(app.getHttpServer()).get('/api/tours');
    tourId = tours.body[0].id;

    const slots = await request(app.getHttpServer()).get(
      `/api/tours/${tourId}/slots`,
    );
    slotId = slots.body[0].id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/tours returns tours with location', () => {
    return request(app.getHttpServer())
      .get('/api/tours')
      .expect(200)
      .expect((res) => {
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0].locationName).toBeDefined();
        expect(res.body[0].pricePerGuest).toBeDefined();
      });
  });

  it('GET /api/tours/:id/slots returns time windows', () => {
    return request(app.getHttpServer())
      .get(`/api/tours/${tourId}/slots`)
      .expect(200)
      .expect((res) => {
        expect(res.body[0].startTime).toBeDefined();
        expect(res.body[0].endTime).toBeDefined();
      });
  });

  it('creates booking and confirms via webhook', async () => {
    const bookingRes = await request(app.getHttpServer())
      .post(`/api/tours/${tourId}/bookings`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        slotId,
        guests: 1,
        paymentMethod: 'mtn_momo',
        phoneNumber: '+256700000001',
      })
      .expect(201);

    const bookingId = bookingRes.body.bookingId;
    const providerRef = bookingRes.body.providerReference;

    await request(app.getHttpServer())
      .post('/api/webhooks/mtn-momo')
      .send({
        providerReference: providerRef,
        merchantReference: bookingId,
        status: 'successful',
        amount: bookingRes.body.totalAmount,
        currency: 'UGX',
      })
      .expect(201);

    const booking = await request(app.getHttpServer())
      .get(`/api/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(booking.body.status).toBe('confirmed');
    expect(booking.body.ticketCode).toMatch(/^DYP-TKT-/);
  });

  it('GET /api/wallet includes tour_booking transaction', async () => {
    const wallet = await request(app.getHttpServer())
      .get('/api/wallet')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const tourTx = wallet.body.transactions.find(
      (t: { type: string }) => t.type === 'tour_booking',
    );
    expect(tourTx).toBeDefined();
    expect(tourTx.provider).toBe('mtn_momo');
  });
});
