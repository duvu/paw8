import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { I18nService, I18nContext } from 'nestjs-i18n';

// Map of known error codes to i18n keys
const ERROR_KEY_MAP: Record<string, string> = {
  'Invalid credentials': 'auth.invalidCredentials',
  'Invalid or expired refresh token': 'auth.invalidToken',
  'Invalid token payload': 'auth.invalidPayload',
  'Account is locked': 'auth.accountLocked',
  'Tenant account is locked': 'auth.tenantLocked',
  'Current password is incorrect': 'auth.currentPasswordIncorrect',
  'DUPLICATE_IDENTITY': 'customer.duplicateIdentity',
  'DUPLICATE_PHONE': 'customer.duplicatePhone',
  'Contract not found': 'contract.notFound',
  'Contract not found in your store': 'contract.notInStore',
  'Cannot update due date after transactions have been recorded': 'contract.cannotUpdateDueDate',
  'Contract cannot be extended in its current status': 'contract.cannotExtend',
  'Disbursement only allowed for draft/active contracts': 'contract.disbursementNotAllowed',
  'Cannot void a void or reversal transaction': 'transaction.cannotVoid',
  'File not found': 'file.notFound',
  'Invalid upload token format': 'file.invalidUploadTokenFormat',
  'Invalid upload token for this tenant': 'file.invalidUploadToken',
  'Some assets are already pawned': 'asset.alreadyPawned',
  'Some assets not found or do not belong to tenant/store': 'asset.notBelongToTenantStore',
};

@Injectable()
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly i18n?: I18nService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const lang = this.getLang(request);

    let errorPayload: string | string[];
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        const i18nKey = ERROR_KEY_MAP[res] ?? res;
        errorPayload = this.translate(i18nKey, lang);
      } else {
        const msg = (res as { message?: string | string[] })?.message;
        if (Array.isArray(msg)) {
          // ValidationPipe returns array of messages — translate each
          errorPayload = msg.map((m) => {
            const key = ERROR_KEY_MAP[m] ?? m;
            return this.translate(key, lang);
          });
        } else if (typeof msg === 'string') {
          const key = ERROR_KEY_MAP[msg] ?? msg;
          errorPayload = this.translate(key, lang);
        } else {
          errorPayload = this.translate('common.internalError', lang);
        }
      }
    } else {
      errorPayload = this.translate('common.internalError', lang);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      error: errorPayload,
    });
  }

  private getLang(request: Request): string {
    const header = request?.headers?.['accept-language'];
    if (!header) return 'vi';
    const lang = header.split(',')[0].split('-')[0].trim().toLowerCase();
    return ['en', 'vi', 'zh'].includes(lang) ? lang : 'vi';
  }

  private translate(key: string, lang: string): string {
    if (!this.i18n) return key;
    try {
      const translated = this.i18n.translate(key as any, { lang });
      return translated as string ?? key;
    } catch {
      return key;
    }
  }
}
