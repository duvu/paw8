## Why

The paw8 platform currently has no internationalization support — all UI strings, error messages, and labels are hardcoded in a single language (Vietnamese). To serve a broader market (regional chains, overseas operators, or Chinese-speaking users), the platform must support English, Vietnamese, and Chinese (Simplified) across the web portal, mobile app, and API error responses.

## What Changes

- Add i18n framework to Next.js web portal (next-intl) with locale switching (en / vi / zh)
- Add i18n to Flutter mobile app (flutter_localizations + ARB files) for en / vi / zh
- Add i18n to NestJS API: all user-facing error messages and validation messages localized based on `Accept-Language` header
- Translation files (JSON/ARB) for all three locales covering: navigation labels, form labels/placeholders, error messages, status enums, action buttons, report titles, and toast/notification text
- Locale preference persisted per user (stored in user settings / localStorage / secure storage)
- Language switcher UI component in web portal header and mobile settings screen

## Capabilities

### New Capabilities

- `web-i18n`: i18n integration for Next.js web portal using next-intl; locale routing, translation files, language switcher component
- `mobile-i18n`: i18n integration for Flutter mobile app using flutter_localizations + ARB; language switcher in settings
- `api-i18n`: NestJS API localization — error messages and validation errors localized via Accept-Language header; supported locales: en, vi, zh

### Modified Capabilities

<!-- No existing spec-level requirements change — this is an additive cross-cutting concern -->

## Impact

- **Web**: `apps/web/` — new `messages/` directory (en.json, vi.json, zh.json), next-intl config, layout wraps with `NextIntlClientProvider`, all pages updated to use `useTranslations()`
- **Mobile**: `apps/mobile/` — new `l10n/` directory (intl_en.arb, intl_vi.arb, intl_zh.arb), flutter_localizations in pubspec, all screens updated to use `AppLocalizations.of(context)`
- **Backend**: `apps/api-gateway/` — new i18n module using nestjs-i18n; validation pipe uses i18n; error filter returns localized messages; new `locales/` directory with JSON translation files
- **Dependencies added**: next-intl (web), nestjs-i18n (api), flutter_localizations (mobile)
- **No database schema changes** — locale preference stored in `tenant_settings` or browser/device storage
