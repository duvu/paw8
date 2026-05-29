## Context

The paw8 platform (NestJS API + Next.js web + Flutter mobile) currently has all user-facing strings hardcoded with no translation layer. The system must support **English (en)**, **Vietnamese (vi)**, and **Chinese Simplified (zh)** across all three surfaces. This is a cross-cutting additive change — no business logic changes, but every user-visible string needs to be externalized and translated.

Current state:
- Next.js: no i18n setup, strings inline in JSX
- Flutter: no ARB/localization setup, strings inline in widgets
- NestJS: error messages and validation strings are hardcoded English in DTOs and exception filters

Constraints:
- Must not break existing functionality or routes
- Locale switching must be seamless (no full page reload on web; minimal friction on mobile)
- API must respect `Accept-Language: en | vi | zh` header; default to `vi` (primary market)
- Translation files must be maintainable — flat key structure, one file per locale per surface

## Goals / Non-Goals

**Goals:**
- Externalize all user-visible strings (labels, errors, status names, buttons, toasts) into locale files
- Support en / vi / zh on web portal, Flutter mobile, and NestJS API error responses
- Language switcher in web header and Flutter settings screen
- Locale preference persisted in `localStorage` (web) and `flutter_secure_storage` (mobile)
- NestJS validation errors localized via `Accept-Language` header using nestjs-i18n
- Default locale: Vietnamese (`vi`)

**Non-Goals:**
- RTL language support
- Pluralization rules beyond simple count-based (no complex morphology)
- Database content translation (tenant names, store names, contract notes remain as entered)
- Dynamic locale loading / lazy splitting per route
- Machine translation pipeline (translations are human-authored)
- Admin UI for managing translations at runtime

## Decisions

### D1: Next.js — use `next-intl` (not `react-i18next` or raw `next/router` locale)

**Decision:** `next-intl` v3 with App Router support.

**Rationale:** `next-intl` is the de-facto standard for Next.js App Router i18n. It uses React Server Components natively, supports static rendering, and avoids the client bundle bloat of react-i18next. It handles locale routing via middleware, meaning URLs become `/en/...`, `/vi/...`, `/zh/...` automatically.

**Alternative considered:** `react-i18next` — works but not App Router-native; requires client-side hydration for all translated content.

**Implementation:**
- `middleware.ts` at `apps/web/src/` handles locale detection and redirects
- Messages in `apps/web/messages/{en,vi,zh}.json`
- Root layout wraps children in `NextIntlClientProvider`
- `useTranslations('namespace')` in client components; `getTranslations()` in server components
- Locale stored in `next-intl` cookie (`NEXT_LOCALE`) for persistence

### D2: Flutter — use `flutter_localizations` + ARB files (official approach)

**Decision:** Flutter's built-in `flutter_localizations` + `intl` package + `.arb` files generated into `AppLocalizations`.

**Rationale:** The official Flutter approach generates type-safe accessor classes from ARB files (`AppLocalizations.of(context).loginTitle`). No third-party dependency needed beyond `flutter_localizations` (already in Flutter SDK) and `intl`.

**Alternative considered:** `easy_localization` — simpler API but requires runtime JSON loading; less type-safe.

**Implementation:**
- ARB files at `apps/mobile/lib/l10n/app_{en,vi,zh}.arb`
- `flutter gen-l10n` generates `AppLocalizations`
- `MaterialApp` wraps with `localizationsDelegates` and `supportedLocales`
- Current locale held in a Riverpod `StateProvider<Locale>`; persisted in `flutter_secure_storage`

### D3: NestJS API — use `nestjs-i18n` for error message localization

**Decision:** `nestjs-i18n` v10 with `AcceptLanguageResolver`.

**Rationale:** `nestjs-i18n` integrates with NestJS's DI system, works with ValidationPipe via custom decorator (`@I18nValidationExceptionFilter`), and supports JSON translation files. The `AcceptLanguageResolver` reads the `Accept-Language` header transparently.

**Alternative considered:** Custom middleware returning translated strings from a map — viable but not maintainable for 3 locales × hundreds of keys.

**Implementation:**
- Translation files at `apps/api-gateway/src/i18n/{en,vi,zh}.json`
- `I18nModule.forRoot()` in `AppModule` with `AcceptLanguageResolver`
- `AllExceptionsFilter` updated to call `i18nService.translate()` for known error keys
- Validation DTOs use `@IsNotEmpty({ message: 'validation.required' })` style keys

### D4: Translation key structure — flat namespaced keys

**Decision:** Flat keys with dot-separated namespace prefix (e.g., `auth.invalidCredentials`, `contract.status.active`).

**Rationale:** Easier to grep, diff, and maintain than deeply nested objects. Avoids the need for special nested-key syntax in templates.

**Example structure:**
```json
{
  "auth.loginTitle": "Login",
  "auth.invalidCredentials": "Invalid email or password",
  "contract.status.active": "Active",
  "contract.status.overdue": "Overdue",
  "validation.required": "This field is required"
}
```

### D5: Default locale = Vietnamese (`vi`)

The primary market is Vietnam. All existing hardcoded strings are Vietnamese. Default locale is `vi`; unknown locales fall back to `vi`.

## Risks / Trade-offs

- **Translation coverage gap** → Mitigation: provide a script `pnpm i18n:check` that diffs keys between en.json and vi.json/zh.json and prints missing keys; run in CI.
- **next-intl locale prefix changes URL structure** (`/dashboard` → `/vi/dashboard`) → Mitigation: configure `pathnames` in next-intl to keep existing paths working via `localePrefix: 'as-needed'` so default locale (`vi`) has no prefix.
- **nestjs-i18n adds startup overhead** (reads JSON files) → negligible for monolith; no mitigation needed.
- **ARB codegen requires `flutter gen-l10n` step** → Mitigation: add to `pubspec.yaml` `generate: true` so it runs automatically on `flutter pub get`/`flutter build`.
- **Chinese (Simplified) translations** require native speaker review → initial zh.json uses English as placeholder for strings not yet translated; system falls back gracefully.

## Migration Plan

1. Install dependencies (no breaking changes to existing routes/data)
2. Create translation files with all current hardcoded strings extracted
3. Update components/screens one module at a time (auth → layout → pages)
4. Update NestJS error filter + DTOs
5. Add language switcher UI last (after all strings are covered)
6. Run `i18n:check` script to verify key parity
7. No database migrations required
8. Rollback: remove i18n packages and revert to hardcoded strings (feature-flaggable)
