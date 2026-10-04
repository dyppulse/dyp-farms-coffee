import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export const TICKET_STATUSES = ['open', 'in_progress', 'resolved'] as const;
export const TICKET_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
export const TICKET_TEAMS = [
  'payments',
  'logistics',
  'quality',
  'agronomy',
  'engineering',
] as const;

export type TicketStatusValue = (typeof TICKET_STATUSES)[number];
export type TicketPriorityValue = (typeof TICKET_PRIORITIES)[number];
export type TicketTeamValue = (typeof TICKET_TEAMS)[number];

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  body: string;
}

/** Admin PATCH: any subset of status / priority. */
export class UpdateTicketDto {
  @IsOptional()
  @IsString()
  @IsIn(TICKET_STATUSES)
  status?: TicketStatusValue;

  @IsOptional()
  @IsString()
  @IsIn(TICKET_PRIORITIES)
  priority?: TicketPriorityValue;
}

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  body: string;

  /** Staff-only note. Ignored (forced false) for reporters. */
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  internal?: boolean;
}

/** Reporter asks for their ticket to be escalated. */
export class RequestEscalationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}

/** Admin / tech-ops escalates a ticket to a team. */
export class EscalateTicketDto {
  @IsString()
  @IsIn(TICKET_TEAMS)
  team: TicketTeamValue;

  @IsOptional()
  @IsString()
  @IsIn(TICKET_PRIORITIES)
  priority?: TicketPriorityValue;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
