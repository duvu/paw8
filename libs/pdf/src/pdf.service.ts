import { Injectable, NotFoundException, InternalServerErrorException, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

@Injectable()
export class PdfService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PdfService.name);
  private browser: import('puppeteer-core').Browser | null = null;
  private readonly templates = new Map<string, HandlebarsTemplateDelegate>();
  private readonly templatesDir: string;

  constructor(private readonly configService: ConfigService) {
    this.templatesDir = path.join(__dirname, 'templates');
    this.registerHelpers();
  }

  async onModuleInit(): Promise<void> {
    await this.launchBrowser();
    this.loadTemplates();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
  }

  private async launchBrowser(): Promise<void> {
    const puppeteer = await import('puppeteer-core');
    const chromiumPath = this.configService.get<string>('CHROMIUM_PATH');
    const executablePath = chromiumPath || this.findSystemChromium();

    if (!executablePath) {
      throw new InternalServerErrorException(
        'Chromium not found. Set CHROMIUM_PATH env var or install chromium-browser.'
      );
    }

    this.browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    this.logger.log(`Browser launched: ${executablePath}`);
  }

  private findSystemChromium(): string | null {
    const candidates = [
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/snap/bin/chromium',
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
    return null;
  }

  private loadTemplates(): void {
    if (!fs.existsSync(this.templatesDir)) {
      this.logger.warn(`Templates directory not found: ${this.templatesDir}`);
      return;
    }
    const files = fs.readdirSync(this.templatesDir).filter((f) => f.endsWith('.hbs'));
    for (const file of files) {
      const name = path.basename(file, '.hbs');
      const src = fs.readFileSync(path.join(this.templatesDir, file), 'utf8');
      this.templates.set(name, Handlebars.compile(src));
    }
    this.logger.log(`Loaded ${this.templates.size} PDF templates: ${[...this.templates.keys()].join(', ')}`);
  }

  private registerHelpers(): void {
    Handlebars.registerHelper('vnd', (amount: number | string) => {
      const n = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
      return new Handlebars.SafeString(
        n.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' đ'
      );
    });

    Handlebars.registerHelper('vndDate', (date: string | Date) => {
      if (!date) return '';
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    });

    Handlebars.registerHelper('vndWords', (amount: number | string) => {
      const n = Math.round(typeof amount === 'string' ? parseFloat(amount) : (amount || 0));
      return new Handlebars.SafeString(numberToVietnameseWords(n));
    });

    Handlebars.registerHelper('txnTypeLabel', (type: string) => {
      const labels: Record<string, string> = {
        disbursement: 'Giải ngân',
        interest_collection: 'Thu lãi',
        fee_collection: 'Thu phí',
        principal_partial: 'Thu gốc một phần',
        settlement: 'Tất toán',
        extension: 'Gia hạn',
        adjustment: 'Điều chỉnh',
        void: 'Hủy giao dịch',
        reversal: 'Hoàn giao dịch',
      };
      return labels[type] || type;
    });

    Handlebars.registerHelper('paymentMethodLabel', (method: string) => {
      const labels: Record<string, string> = {
        cash: 'Tiền mặt',
        bank_transfer: 'Chuyển khoản',
        other: 'Khác',
      };
      return labels[method] || method;
    });

    Handlebars.registerHelper('interestTypeLabel', (type: string) => {
      const labels: Record<string, string> = {
        DAILY: 'Theo ngày',
        MONTHLY: 'Theo tháng',
        PER_PERIOD: 'Theo kỳ',
      };
      return labels[type] || type;
    });

    Handlebars.registerHelper('timeStr', (date: string | Date) => {
      const d = date instanceof Date ? date : new Date(date);
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    });
  }

  async render(templateName: string, context: Record<string, unknown>): Promise<Buffer> {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new NotFoundException(`PDF template '${templateName}' not found`);
    }

    const html = template(context);
    return this.htmlToPdf(html);
  }

  private async htmlToPdf(html: string): Promise<Buffer> {
    if (!this.browser) {
      // Recovery: try to relaunch once
      try {
        await this.launchBrowser();
      } catch {
        throw new InternalServerErrorException('PDF browser unavailable');
      }
    }

    let page: import('puppeteer-core').Page | null = null;
    try {
      page = await this.browser!.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      });
      return Buffer.from(pdf);
    } catch (err) {
      // On browser crash, try relaunch once
      this.logger.error('PDF generation error, attempting browser restart', err);
      try {
        if (this.browser) await this.browser.close().catch(() => {});
        this.browser = null;
        await this.launchBrowser();
        page = await this.browser!.newPage();
        await page.setContent(html, { waitUntil: 'load' });
        const pdf = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
        });
        return Buffer.from(pdf);
      } catch (retryErr) {
        throw new InternalServerErrorException('PDF generation failed after retry');
      }
    } finally {
      if (page) await page.close().catch(() => {});
    }
  }
}

// Vietnamese number to words (no external lib)
function numberToVietnameseWords(n: number): string {
  if (n === 0) return 'Không đồng';
  if (n < 0) return 'Âm ' + numberToVietnameseWords(-n);

  const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const teens = ['mười', 'mười một', 'mười hai', 'mười ba', 'mười bốn', 'mười lăm',
                 'mười sáu', 'mười bảy', 'mười tám', 'mười chín'];

  function readHundreds(n: number): string {
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;
    let result = '';
    if (h > 0) result += ones[h] + ' trăm';
    if (t === 0 && u === 0) return result;
    if (t === 0 && h > 0) { result += ' linh ' + ones[u]; return result; }
    if (t === 1) { result += (h > 0 ? ' ' : '') + teens[u]; return result; }
    result += (h > 0 ? ' ' : '') + ones[t] + ' mươi';
    if (u === 1 && t > 1) result += ' mốt';
    else if (u === 5 && t > 1) result += ' lăm';
    else if (u > 0) result += ' ' + ones[u];
    return result;
  }

  const parts: string[] = [];
  const billions = Math.floor(n / 1_000_000_000);
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1_000);
  const remainder = n % 1_000;

  if (billions > 0) parts.push(readHundreds(billions) + ' tỷ');
  if (millions > 0) parts.push(readHundreds(millions) + ' triệu');
  if (thousands > 0) parts.push(readHundreds(thousands) + ' nghìn');
  if (remainder > 0) parts.push(readHundreds(remainder));

  const words = parts.join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1) + ' đồng';
}
