## ADDED Requirements

### Requirement: PdfService renders HTML templates to PDF buffers
The system SHALL provide a `PdfService` in `libs/pdf/` that accepts a template name and a data context object, renders the Handlebars HTML template, and returns a `Buffer` containing a valid PDF document.

#### Scenario: Successful PDF buffer generation
- **WHEN** `PdfService.render(templateName, context)` is called with a registered template name and a valid data context
- **THEN** the service returns a `Buffer` with MIME type `application/pdf` containing the rendered document

#### Scenario: Unknown template name
- **WHEN** `PdfService.render(templateName, context)` is called with an unrecognized template name
- **THEN** the service throws a `NotFoundException` with message `Template '<name>' not found`

### Requirement: PdfService registers Vietnamese Handlebars helpers
The system SHALL register three global Handlebars helpers at module startup: `vnd`, `vndDate`, and `vndWords`.

#### Scenario: VND currency formatting
- **WHEN** the `{{vnd amount}}` helper is invoked with a numeric value (e.g., `1500000`)
- **THEN** the output is `1.500.000 đ` (dot-separated thousands, `đ` suffix)

#### Scenario: Vietnamese date formatting
- **WHEN** the `{{vndDate date}}` helper is invoked with a Date or ISO string
- **THEN** the output is `dd/MM/yyyy` format (e.g., `30/05/2026`)

#### Scenario: Amount in Vietnamese words
- **WHEN** the `{{vndWords amount}}` helper is invoked with an integer amount in đồng (e.g., `1500000`)
- **THEN** the output is the Vietnamese word representation (e.g., `Một triệu năm trăm nghìn đồng`)

### Requirement: PdfService manages a singleton Puppeteer browser instance
The system SHALL launch one Puppeteer browser instance when `PdfModule` initializes and reuse it for all PDF render requests. The browser SHALL be closed when the module is destroyed.

#### Scenario: Browser reuse across multiple render calls
- **WHEN** `PdfService.render()` is called multiple times concurrently
- **THEN** each call opens a new page on the existing browser instance (not a new Chromium process)

#### Scenario: Browser crash recovery
- **WHEN** the browser process crashes and `PdfService.render()` is called
- **THEN** the service re-launches the browser and retries the render once before throwing an `InternalServerErrorException`

### Requirement: PDF templates load from filesystem at startup
The system SHALL load all `.hbs` template files from `libs/pdf/src/templates/` at module initialization and cache compiled Handlebars template functions in memory.

#### Scenario: Templates cached at startup
- **WHEN** the `PdfModule` initializes
- **THEN** all `.hbs` files in the templates directory are compiled and cached; no filesystem read occurs during render requests

### Requirement: CHROMIUM_PATH environment variable configures Chromium binary
The system SHALL read the `CHROMIUM_PATH` environment variable to determine the Chromium executable path. If unset, it SHALL use Puppeteer's bundled Chromium (local dev default).

#### Scenario: System Chromium in Docker
- **WHEN** `CHROMIUM_PATH=/usr/bin/chromium-browser` is set and the service renders a PDF
- **THEN** Puppeteer uses the system Chromium binary (not bundled)
