## ADDED Requirements

### Requirement: Web portal supports English, Vietnamese, and Chinese locale switching
The web portal SHALL support three locales — `en` (English), `vi` (Vietnamese), and `zh` (Chinese Simplified). All user-visible strings (navigation labels, form labels, placeholders, error messages, button text, status values, report titles, toast notifications) SHALL be externalized into per-locale JSON message files. The default locale SHALL be `vi`.

#### Scenario: User sees Vietnamese by default
- **WHEN** a user visits the portal without a locale preference set
- **THEN** all UI text is displayed in Vietnamese

#### Scenario: User switches to English
- **WHEN** user selects "English" in the language switcher in the portal header
- **THEN** all UI text immediately updates to English without a full page reload
- **THEN** the locale preference is persisted in the `NEXT_LOCALE` cookie so subsequent visits use English

#### Scenario: User switches to Chinese Simplified
- **WHEN** user selects "中文" in the language switcher
- **THEN** all UI text updates to Chinese Simplified
- **THEN** the locale preference is persisted

#### Scenario: Unknown locale falls back to Vietnamese
- **WHEN** a browser `Accept-Language` header contains an unsupported locale
- **THEN** the portal defaults to Vietnamese (`vi`)

### Requirement: Locale routing uses no prefix for default locale
The web portal SHALL use `localePrefix: 'as-needed'` so that the default locale (`vi`) requires no URL prefix (e.g., `/dashboard` not `/vi/dashboard`), while non-default locales are prefixed (e.g., `/en/dashboard`).

#### Scenario: Vietnamese user accesses dashboard at root path
- **WHEN** a Vietnamese user navigates to `/dashboard`
- **THEN** the page renders in Vietnamese without redirect

#### Scenario: English user accesses prefixed path
- **WHEN** an English user navigates to `/en/dashboard`
- **THEN** the page renders in English

### Requirement: Language switcher component in web portal header
The portal header SHALL include a language switcher UI element showing the current locale and allowing selection of any supported locale.

#### Scenario: Language switcher shows current locale
- **WHEN** the user is on any page with locale `en`
- **THEN** the language switcher displays "English" (or "EN") as the active selection

#### Scenario: All three locales are available for selection
- **WHEN** the user opens the language switcher dropdown
- **THEN** options "English", "Tiếng Việt", and "中文" are all visible and selectable

### Requirement: Translation key parity check
A developer script (`pnpm i18n:check`) SHALL compare keys between all locale files and output any missing or extra keys.

#### Scenario: Missing key detected
- **WHEN** `pnpm i18n:check` is run and `zh.json` is missing a key present in `vi.json`
- **THEN** the script outputs the missing key name and exits with a non-zero code
