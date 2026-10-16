import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const DEFAULT_PAGE_SIZE = 100;
export const MAX_PAGE_SIZE = 200;

/** ?limit=&offset= on list endpoints. Responses stay plain arrays. */
export class PageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

export type Page = { take: number; skip: number };

/** Turns the query into Prisma take/skip. Every list is capped, even when no query is sent. */
export function toPage(query?: PageQueryDto, defaultSize = DEFAULT_PAGE_SIZE): Page {
  return { take: query?.limit ?? defaultSize, skip: query?.offset ?? 0 };
}

export const FIRST_PAGE: Page = { take: DEFAULT_PAGE_SIZE, skip: 0 };
