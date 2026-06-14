import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsStrongPassword } from '../../../common/src/decorators/is-strong-password.decorator';

export class LoginDto {
  @IsEmail({}, { message: 'validation.isEmail' })
  @ApiProperty()
  email: string;

  @IsString({ message: 'validation.isString' })
  @MinLength(6, { message: 'validation.minLength' })
  @ApiProperty()
  password: string;
}

export class ChangePasswordDto {
  @IsString({ message: 'validation.isString' })
  @MinLength(6, { message: 'validation.minLength' })
  @ApiProperty()
  currentPassword: string;

  @IsString({ message: 'validation.isString' })
  @IsStrongPassword()
  @ApiProperty()
  newPassword: string;
}

export class RefreshTokenDto {
  @IsString({ message: 'validation.isString' })
  @ApiProperty()
  refreshToken: string;
}
