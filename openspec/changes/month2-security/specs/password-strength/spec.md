# Spec: password-strength

## Summary

Create a shared `@IsStrongPassword()` class-validator decorator and apply it to all password fields across the codebase.

## Decorator

File: `libs/common/src/decorators/is-strong-password.decorator.ts`

```typescript
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName,
      options: {
        message:
          'Password must be at least 8 characters and include an uppercase letter, lowercase letter, and number',
        ...validationOptions,
      },
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          return typeof value === 'string' && PASSWORD_REGEX.test(value);
        },
      },
    });
  };
}
```

**Rules**: min 8 characters, ≥1 uppercase (A–Z), ≥1 lowercase (a–z), ≥1 digit (0–9).

No special character requirement — trade-off for mobile input UX for Vietnamese staff.

## Export

File: `libs/common/src/decorators/index.ts` (or `libs/common/src/index.ts`)

```typescript
export * from './is-strong-password.decorator';
```

## Application

### CreateUserDto

File: `libs/users/src/dto/user.dto.ts`

```typescript
import { IsStrongPassword } from '../../common/src/decorators/is-strong-password.decorator';

export class CreateUserDto {
  // ... other fields

  @IsStrongPassword()
  @ApiProperty({ description: 'Password — min 8 chars, 1 uppercase, 1 lowercase, 1 digit' })
  password: string;
}
```

### ChangePasswordDto

File: `libs/auth/src/dto/auth.dto.ts`

```typescript
import { IsStrongPassword } from '../../common/src/decorators/is-strong-password.decorator';

export class ChangePasswordDto {
  @IsString()
  @ApiProperty()
  currentPassword: string;

  @IsStrongPassword()
  @ApiProperty({ description: 'New password — min 8 chars, 1 uppercase, 1 lowercase, 1 digit' })
  newPassword: string;
}
```

## Validation Behavior

With `ValidationPipe({ whitelist: true, transform: true })` already active:

- Weak password → `400 Bad Request` with clear error message
- No change needed to pipeline configuration
- Error response example:
  ```json
  {
    "statusCode": 400,
    "message": ["Password must be at least 8 characters and include an uppercase letter, lowercase letter, and number"],
    "error": "Bad Request"
  }
  ```

## Verification

1. POST `/users` with password `password` → `400` (no uppercase, no digit)
2. POST `/users` with password `Password` → `400` (no digit)
3. POST `/users` with password `Pass1` → `400` (too short)
4. POST `/users` with password `Password1` → `200` (valid)
5. PATCH `/auth/change-password` with `newPassword: "abc"` → `400`
6. PATCH `/auth/change-password` with `newPassword: "Passw0rd"` → `200`
