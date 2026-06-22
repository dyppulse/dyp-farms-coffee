import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: process.env.SMTP_HOST
        ? {
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          }
        : { jsonTransport: true },
      defaults: {
        from: process.env.MAIL_FROM || 'Dyp Farms <noreply@dypfarms.com>',
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class NotificationsModule {}
