## 1. API i18n Setup (nestjs-i18n)

- [x] 1.1 Install `nestjs-i18n` in `apps/api-gateway`: `pnpm add nestjs-i18n`
- [x] 1.2 Create `apps/api-gateway/src/i18n/vi.json` with all current hardcoded error/validation message keys in Vietnamese
- [x] 1.3 Create `apps/api-gateway/src/i18n/en.json` with English translations for all keys
- [x] 1.4 Create `apps/api-gateway/src/i18n/zh.json` with Chinese Simplified translations for all keys
- [x] 1.5 Register `I18nModule.forRoot({ fallbackLanguage: 'vi', loaderOptions: { path: 'src/i18n/', watch: true }, resolvers: [AcceptLanguageResolver] })` in `AppModule`
- [x] 1.6 Update `AllExceptionsFilter` to inject `I18nService` and call `i18nService.translate(key, { lang })` for known error keys
- [x] 1.7 Update all DTO validation decorators to use i18n message keys (e.g., `@IsNotEmpty({ message: 'validation.required' })`)
- [x] 1.8 Replace `I18nValidationPipe` (or configure existing `ValidationPipe` with i18n) so DTO errors are automatically translated
- [x] 1.9 Verify API starts with no "missing translation" warnings for all three locale files
- [x] 1.10 Add integration test: POST /auth/login with wrong password + `Accept-Language: en` returns English error message

## 2. Web Portal i18n Setup (next-intl)

- [x] 2.1 Install `next-intl` in `apps/web`: `pnpm add next-intl`
- [x] 2.2 Create `apps/web/messages/vi.json` with Vietnamese translations for all current hardcoded strings (navigation, forms, statuses, buttons, errors, report titles)
- [x] 2.3 Create `apps/web/messages/en.json` with English translations
- [x] 2.4 Create `apps/web/messages/zh.json` with Chinese Simplified translations
- [x] 2.5 Create `apps/web/src/middleware.ts` using `createMiddleware` from next-intl with `locales: ['vi','en','zh']`, `defaultLocale: 'vi'`, `localePrefix: 'as-needed'`
- [x] 2.6 Create `apps/web/src/i18n.ts` (next-intl config) and `apps/web/src/navigation.ts` (typed navigation helpers)
- [x] 2.7 Update `apps/web/src/app/layout.tsx` to wrap with `NextIntlClientProvider` passing locale and messages
- [x] 2.8 Update `apps/web/src/app/(dashboard)/layout.tsx` to use `useTranslations('nav')` for sidebar navigation labels
- [x] 2.9 Update login page (`app/login/page.tsx`) to use `useTranslations('auth')` for all strings
- [x] 2.10 Update dashboard page to use `useTranslations('dashboard')` for metric labels
- [x] 2.11 Update customers pages (list, new, detail) to use `useTranslations('customers')`
- [x] 2.12 Update assets pages to use `useTranslations('assets')`
- [x] 2.13 Update contracts pages (list, new, detail, modals) to use `useTranslations('contracts')`
- [x] 2.14 Update transactions, reports, users, stores, audit-logs pages to use translations
- [x] 2.15 Create `LanguageSwitcher` component (`components/language-switcher.tsx`) with dropdown for en/vi/zh and place it in the portal header
- [x] 2.16 Verify `pnpm build` passes with no TypeScript errors

## 3. Flutter Mobile i18n Setup

- [x] 3.1 Add `flutter_localizations` SDK dependency and `intl: ^0.19.0` to `apps/mobile/pubspec.yaml`; set `generate: true`
- [x] 3.2 Create `apps/mobile/l10n.yaml` config file pointing to `lib/l10n/` and template ARB `app_vi.arb`
- [x] 3.3 Create `apps/mobile/lib/l10n/app_vi.arb` with Vietnamese strings for all screens (login, home, customers, contracts, assets, settings, statuses, buttons, errors)
- [x] 3.4 Create `apps/mobile/lib/l10n/app_en.arb` with English strings matching all keys in `app_vi.arb`
- [x] 3.5 Create `apps/mobile/lib/l10n/app_zh.arb` with Chinese Simplified strings matching all keys
- [x] 3.6 Run `flutter gen-l10n` to generate `AppLocalizations` (verify no errors)
- [x] 3.7 Update `MaterialApp` in `lib/main.dart` to include `localizationsDelegates` (AppLocalizations, GlobalMaterialLocalizations, GlobalWidgetsLocalizations), `supportedLocales`, and bind locale to Riverpod `localeProvider`
- [x] 3.8 Create `lib/core/providers/locale_provider.dart` — `StateProvider<Locale>` initialized from `flutter_secure_storage`, with `setLocale(locale)` method that persists the choice
- [x] 3.9 Update login screen to use `AppLocalizations.of(context)` for all strings
- [x] 3.10 Update home screen to use `AppLocalizations`
- [x] 3.11 Update customers screens (list, detail, notes) to use `AppLocalizations`
- [x] 3.12 Update contracts screens (list, detail, upcoming due, overdue) to use `AppLocalizations`
- [x] 3.13 Update asset photo upload screen to use `AppLocalizations`
- [x] 3.14 Create settings screen (`lib/features/settings/screens/settings_screen.dart`) with language selector (ListTile per locale) that calls `setLocale()`
- [x] 3.15 Add settings route to `router.dart` and settings icon to bottom nav or app bar
- [x] 3.16 Verify `flutter analyze` passes with no errors

## 4. Key Parity Script

- [x] 4.1 Create `scripts/i18n-check.mjs` — Node.js script that reads all three locale JSON files (web messages/ and api src/i18n/) and prints any keys present in vi but missing in en or zh (and vice versa); exits with code 1 if any missing
- [x] 4.2 Add `"i18n:check": "node scripts/i18n-check.mjs"` to root `package.json` scripts
- [x] 4.3 Run `pnpm i18n:check` and verify all three web locale files and all three API locale files have identical key sets

## 5. Verification

- [x] 5.1 Start docker services and API, confirm API returns Vietnamese error by default and English error with `Accept-Language: en`
- [x] 5.2 Start Next.js dev server, verify language switcher changes UI language across all pages
- [x] 5.3 Run `pnpm build` in `apps/web` — confirm clean build
- [x] 5.4 Run `pnpm run build` in `apps/api-gateway` — confirm clean build
- [x] 5.5 Run `flutter analyze` in `apps/mobile` — confirm no errors
- [x] 5.6 Run `pnpm i18n:check` — confirm 0 missing keys
- [x] 5.7 Update this tasks.md marking all completed tasks as `[x]`
