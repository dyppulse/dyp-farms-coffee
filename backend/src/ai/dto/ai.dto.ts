import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class StartChatDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Matches(/^[\w-]+$/, { message: 'conversationId may only contain letters, digits, - and _' })
  conversationId?: string;
}

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message: string;
}
