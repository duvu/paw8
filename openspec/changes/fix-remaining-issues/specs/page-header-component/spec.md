## MODIFIED Requirements

### Requirement: PageHeader subtitle prop
The `PageHeader` component's `subtitle` prop SHALL accept any valid `React.ReactNode` value (strings, numbers, JSX elements, fragments, null, undefined), not only plain strings.

#### Scenario: String subtitle renders correctly
- **WHEN** a string is passed as `subtitle` to `PageHeader`
- **THEN** it SHALL render inside the subtitle `<p>` element as before, without type error

#### Scenario: JSX element subtitle renders correctly
- **WHEN** a JSX element (e.g., `<span className="font-mono">`) is passed as `subtitle`
- **THEN** TypeScript SHALL compile without error (no TS2322) and the element SHALL render inside the subtitle `<p>` wrapper

#### Scenario: No subtitle renders nothing
- **WHEN** `subtitle` prop is omitted or undefined
- **THEN** no subtitle element SHALL be rendered (existing conditional behavior unchanged)
