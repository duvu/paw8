import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark an endpoint as public (no JWT required).
 * Usage: @Public() on a controller or route handler.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
