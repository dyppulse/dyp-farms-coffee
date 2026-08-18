import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class SignUpDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  @IsIn(['farmer', 'roaster', 'tourist'])
  role?: 'farmer' | 'roaster' | 'tourist';
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
