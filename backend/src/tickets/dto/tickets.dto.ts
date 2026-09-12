import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  body: string;
}

export class UpdateTicketStatusDto {
  @IsString()
  @IsIn(['open', 'in_progress', 'resolved'])
  status: 'open' | 'in_progress' | 'resolved';
}
