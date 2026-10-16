import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export const CATEGORIES = ['discussion', 'tips', 'news', 'question'] as const;
export type Category = (typeof CATEGORIES)[number];

export class CreatePostDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;

  @IsIn(CATEGORIES)
  category: Category;
}

export class ReplyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;
}

export class ChatMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message: string;
}
