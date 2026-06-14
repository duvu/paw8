import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * Custom class-validator decorator that enforces password strength:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 digit
 *
 * Usage: @IsStrongPassword()
 */
@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, _args: ValidationArguments): boolean {
    if (typeof value !== 'string') return false;
    if (value.length < 8) return false;
    if (!/[A-Z]/.test(value)) return false;
    if (!/[a-z]/.test(value)) return false;
    if (!/[0-9]/.test(value)) return false;
    return true;
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'Password must be at least 8 characters and contain at least 1 uppercase letter, 1 lowercase letter, and 1 digit';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsStrongPasswordConstraint,
    });
  };
}
