## ADDED Requirements

### Requirement: Mobile authentication and home experience are polished
The mobile application SHALL provide a polished sign-in and home experience with clear primary actions, meaningful dashboard feedback, and coherent navigation.

#### Scenario: Signed-in operator opens the app
- **WHEN** an authenticated user opens the mobile application
- **THEN** they see a polished home surface with meaningful operational cards and clear navigation to core actions

#### Scenario: Login attempt fails on mobile
- **WHEN** a login attempt fails on the mobile application
- **THEN** the screen shows a clear and recoverable error state

### Requirement: Mobile session handling is explicit and safe
The mobile application SHALL store, clear, and react to session state consistently with router protection and logout behavior.

#### Scenario: Session token is missing or removed
- **WHEN** the secure session token is absent
- **THEN** the mobile router redirects the user to the sign-in screen

#### Scenario: User logs out
- **WHEN** a user logs out from a refreshed mobile surface
- **THEN** the secure session token is removed and the application returns the user to sign in

### Requirement: Mobile refreshed surfaces are localization-aware
The mobile application SHALL use localized production-ready copy on refreshed surfaces and SHALL remove hardcoded placeholder or unfinished strings from those surfaces.

#### Scenario: User changes language
- **WHEN** the user changes the app language
- **THEN** refreshed home, profile, settings, and session-related text follows the selected locale

### Requirement: Mobile refreshed screens consume the current backend contract
The mobile application SHALL consume the current auth and dashboard contract returned by the backend rather than relying on outdated field names or route assumptions.

#### Scenario: Login succeeds
- **WHEN** `/auth/login` returns the current backend auth response
- **THEN** the mobile client establishes session state from the current access-token contract

#### Scenario: Home dashboard renders
- **WHEN** the home screen loads dashboard metrics
- **THEN** the mobile client maps the current backend dashboard fields to the refreshed cards correctly
