## ADDED Requirements

### Requirement: Button outline variant
The `Button` component SHALL accept `variant="outline"` as a valid prop value, rendering with a transparent background, neutral border, and neutral text color.

#### Scenario: Outline button renders without TypeScript error
- **WHEN** a component passes `variant="outline"` to `<Button>`
- **THEN** TypeScript SHALL compile without error (no TS2322)

#### Scenario: Outline button visual appearance
- **WHEN** `<Button variant="outline">` is rendered
- **THEN** the button SHALL display a transparent background with a neutral-200 border and neutral-700 text, consistent with the existing secondary variant border language

#### Scenario: Outline button hover state
- **WHEN** a user hovers over an outline button
- **THEN** the background SHALL change to neutral-50 to provide visual feedback
