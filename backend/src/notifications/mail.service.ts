import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import * as QRCode from 'qrcode';
import {
  Tour,
  TourSlot,
  Booking,
  OrderItem,
  Product,
  ShopOrder,
} from '@prisma/client';

interface BookingEmailData {
  userName: string;
  tour: Tour;
  slot: TourSlot;
  booking: Booking;
  ticketCode: string;
}

interface OrderEmailData {
  userName: string;
  order: ShopOrder;
  items: (OrderItem & { product: Product })[];
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private mailer: MailerService) {}

  async sendBookingConfirmation(to: string, data: BookingEmailData) {
    const verifyUrl = `${process.env.API_PUBLIC_URL || 'http://localhost:3001/api'}/bookings/verify?code=${data.ticketCode}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl);
    const dateStr = new Date(data.slot.date).toLocaleDateString('en-UG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1B4332;">Your Dyp Farms Tour Ticket</h1>
        <p>Hi ${data.userName},</p>
        <p>Your booking is confirmed! Here are your details:</p>
        <table style="width:100%; border-collapse: collapse;">
          <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Tour</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${data.tour.title}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Location</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${data.tour.locationName}<br/>${data.tour.address}, ${data.tour.city}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Date</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${dateStr}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Time</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${data.slot.startTime} – ${data.slot.endTime}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Guests</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${data.booking.guests}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Amount paid</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${data.booking.totalAmount.toLocaleString()} ${data.booking.currency}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Ticket code</strong></td><td style="padding:8px;border-bottom:1px solid #eee;font-size:18px;font-weight:bold;">${data.ticketCode}</td></tr>
        </table>
        <p style="text-align:center;margin-top:24px;">
          <img src="${qrDataUrl}" alt="Ticket QR" width="200" height="200" />
        </p>
        <p style="color:#666;font-size:12px;text-align:center;">Present this QR code at check-in on the farm.</p>
      </div>
    `;

    if (!process.env.SMTP_HOST) {
      this.logger.log(
        `[DEV] Booking email to ${to} — ticket ${data.ticketCode}`,
      );
      this.logger.debug(html.slice(0, 200));
      return;
    }

    await this.mailer.sendMail({
      to,
      subject: `Your Dyp Farms ticket — ${data.tour.title}`,
      html,
      text: `Booking confirmed: ${data.tour.title} on ${dateStr} ${data.slot.startTime}-${data.slot.endTime}. Ticket: ${data.ticketCode}`,
    });
  }

  async sendOrderConfirmation(to: string, data: OrderEmailData) {
    const rows = data.items
      .map(
        (item) => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #eee;">${item.product.name}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${item.lineTotal.toLocaleString()} ${data.order.currency}</td>
          </tr>`,
      )
      .join('');

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1B4332;">Your Dyp Farms Order</h1>
        <p>Hi ${data.userName},</p>
        <p>Thanks for ordering our coffee! Here's your receipt:</p>
        <table style="width:100%; border-collapse: collapse;">
          <tr><th style="text-align:left;padding:8px;border-bottom:2px solid #333;">Item</th><th style="padding:8px;border-bottom:2px solid #333;">Qty</th><th style="text-align:right;padding:8px;border-bottom:2px solid #333;">Amount</th></tr>
          ${rows}
        </table>
        <p style="text-align:right;margin-top:12px;font-size:16px;"><strong>Total paid: ${data.order.totalAmount.toLocaleString()} ${data.order.currency}</strong></p>
        <p>Delivery: ${data.order.deliveryMethod === 'pickup' ? 'Pickup at the farm' : `Shipping to ${data.order.deliveryAddress ?? 'your address'}`}</p>
        <p style="color:#666;font-size:12px;">Order ID: ${data.order.id}</p>
      </div>
    `;

    if (!process.env.SMTP_HOST) {
      this.logger.log(`[DEV] Order email to ${to} — order ${data.order.id}`);
      this.logger.debug(html.slice(0, 200));
      return;
    }

    await this.mailer.sendMail({
      to,
      subject: `Your Dyp Farms order confirmation`,
      html,
      text: `Order confirmed. Total: ${data.order.totalAmount.toLocaleString()} ${data.order.currency}. Order ID: ${data.order.id}`,
    });
  }
}
