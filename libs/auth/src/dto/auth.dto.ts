import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'validation.isEmail' })
  email: string;

  @IsString({ message: 'validation.isString' })
  @MinLength(6, { message: 'validation.minLength' })
  password: string;
}

export class ChangePasswordDto {
  @IsString({ message: 'validation.isString' })
  @MinLength(6, { message: 'validation.minLength' })
  currentPassword: string;

  @IsString({ message: 'validation.isString' })
  @MinLength(8, { message: 'validation.minLength' })
  newPassword: string;
}

export class RefreshTokenDto {
  @IsString({ message: 'validation.isString' })
  refreshToken: string;
}
