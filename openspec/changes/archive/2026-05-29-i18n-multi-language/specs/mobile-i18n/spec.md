## ADDED Requirements

### Requirement: Flutter app supports English, Vietnamese, and Chinese locale switching
The Flutter mobile app SHALL support three locales — `en`, `vi`, `zh`. All user-visible strings SHALL be defined in ARB files (`app_en.arb`, `app_vi.arb`, `app_zh.arb`) and accessed via the generated `AppLocalizations` class. The default locale SHALL be `vi`.

#### Scenario: App launches in Vietnamese by default
- **WHEN** a user launches the app without a saved locale preference
- **THEN** all UI strings are displayed in Vietnamese

#### Scenario: User changes language to English in settings
- **WHEN** user navigates to the settings screen and selects "English"
- **THEN** the app locale updates to English immediately (without restart)
- **THEN** the selected locale is persisted in flutter_secure_storage

#### Scenario: App restores saved locale on next launch
- **WHEN** user previously saved locale `en` and relaunches the app
- **THEN** the app launches in English

#### Scenario: Unsupported locale falls back to Vietnamese
- **WHEN** the device locale is not en, vi, or zh
- **THEN** the app defaults to Vietnamese

### Requirement: Language switcher in Flutter settings screen
The Flutter app SHALL include a language selection option on the settings/profile screen showing the current locale and allowing selection among the three supported locales.

#### Scenario: Language switcher shows current locale
- **WHEN** user opens the settings screen with locale `zh`
- **THEN** "中文" is shown as the selected language

#### Scenario: Selecting a new language applies immediately
- **WHEN** user selects "English" from the language options
- **THEN** the app re-renders in English without requiring an app restart

### Requirement: ARB files cover all user-visible strings in mobile screens
Every string displayed to the user in the Flutter app (screen titles, labels, button text, error messages, status names, hint text) SHALL have a corresponding key in all three ARB files.

#### Scenario: Login screen strings fully localized
- **WHEN** the app renders the login screen in any supported locale
- **THEN** the title, email label, password label, and login button text all display in the selected locale

#### Scenario: Contract status names localized
- **WHEN** a contract with status `overdue` is displayed in the contracts list
- **THEN** the status badge text renders in the currently active locale (e.g., "Quá hạn" in vi, "Overdue" in en, "逾期" in zh)
