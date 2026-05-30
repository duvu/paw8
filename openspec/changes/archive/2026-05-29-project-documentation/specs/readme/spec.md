## ADDED Requirements

### Requirement: Root README provides project overview
The README SHALL provide a one-paragraph description of paw8, its purpose (multi-tenant pawn shop SaaS), and its tech stack (NestJS, Next.js, Flutter, PostgreSQL, MinIO).

#### Scenario: Tech stack is visible at a glance
- **WHEN** a developer opens the GitHub repository
- **THEN** they see the project description and tech stack within the first screen without scrolling

### Requirement: README includes quick-start instructions
The README SHALL include a Quick Start section that allows a developer to run the full stack locally in under 10 commands.

#### Scenario: Developer follows quick-start from scratch
- **WHEN** a developer clones the repo and follows the Quick Start section
- **THEN** they can run `docker-compose up -d`, run migrations, run seed, start the API, and access the web portal

### Requirement: README links to all sub-documentation
The README SHALL include a Documentation section with links to ARCHITECTURE.md and all files under docs/.

#### Scenario: Navigation to detailed docs
- **WHEN** a developer needs detailed information on any topic
- **THEN** they find a direct link in the README Documentation section
