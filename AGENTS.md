# AGENTS.md

## Project overview

**paw8** — Multi-tenant SaaS for pawn shop chain management (hệ thống quản lý cửa hàng / chuỗi cửa hàng cầm đồ).

Status: early planning phase. No application code yet — only requirements doc and OpenCode/OpenSpec tooling.

Full requirements: `docs/mvp1-requirements.md` (Vietnamese). Read this before working on any feature.

## Tech stack (planned, not yet implemented)

- **Backend**: NestJS — modular monolith, microservice-ready domain boundaries
- **Frontend web**: Next.js
- **Mobile**: Flutter
- **Database**: PostgreSQL — shared schema, `tenant_id` on every business table
- **File storage**: MinIO — private bucket, object keys prefixed by `tenants/{tenant_id}/...`

## Critical architecture rules (from requirements)

- **Never trust `tenant_id` from frontend.** Always derive it from JWT/session: `currentUser.tenantId`.
- Every business query must filter by `tenant_id`. No exceptions.
- Store-level queries must also filter by `store_id` from `currentUser.allowedStoreIds`.
- Financial transactions are **append-only** — no direct UPDATE/DELETE. Use void/reversal/adjustment records.
- File access requires permission check before generating presigned URL (tenant + entity ownership + store scope).
- Unique constraints use `(tenant_id, field)`, not global unique (e.g. `UNIQUE(tenant_id, identity_number)`).

## API conventions

- All routes versioned from day one: `/api/v1/...`
- Contract codes follow tenant/store/date pattern: `{store_code}-{YYYYMM}-{seq}`, not a global sequence.

## Workflow tooling (OpenSpec)

This repo uses OpenSpec for structured change management via slash commands:

| Command | File | Purpose |
|---|---|---|
| `/opsx-propose` | `.opencode/commands/opsx-propose.md` | Propose a new change (design + spec + tasks) |
| `/opsx-apply` | `.opencode/commands/opsx-apply.md` | Implement tasks from a change |
| `/opsx-explore` | `.opencode/commands/opsx-explore.md` | Explore/think through a problem |
| `/opsx-archive` | `.opencode/commands/opsx-archive.md` | Archive a completed change |

Active changes live in `openspec/changes/`. Specs live in `openspec/specs/`. Config in `openspec/config.yaml`.

Add project context (tech stack, conventions) to `openspec/config.yaml` before generating proposals.

## Module boundaries (NestJS target structure)

```
apps/api-gateway/
libs/
  auth/         # JWT, login, current user context
  tenants/      # Tenant CRUD, settings, plan
  users/        # User, RBAC, store assignment
  stores/       # Store/branch management
  customers/    # Customer profile, documents
  assets/       # Pawned assets, photos, inventory
  contracts/    # Pawn contracts, status, interest
  transactions/ # Disbursement, collection, extension, settlement
  files/        # MinIO upload/download, presigned URL, metadata
  reports/      # Dashboard, operational reports
  audit/        # Audit log
  common/       # Shared utilities
```

## Database notes

- All business tables require `tenant_id`; store-scoped tables also require `store_id`.
- Index pattern: `(tenant_id, status)`, `(tenant_id, store_id, status)`, `(tenant_id, due_date)`.
- Use DB migrations — no schema changes without migration files.
- Seed data must include a sample tenant, store, and users with each role.

## What is NOT in MVP1

Do not implement: eKYC/OCR, SMS/Zalo alerts, bank payment integration, VietQR, full accounting, asset liquidation, multi-level approval, POS, offline mobile, data warehouse, physical microservice split.

<!-- OMA:START — managed by oh-my-agent. Do not edit this block manually. -->

# oh-my-agent

## Architecture

- **SSOT**: `.agents/` directory (do not modify directly)
- **Response language**: Follows `language` in `.agents/oma-config.yaml`
- **Skills**: `.agents/skills/` (domain specialists)
- **Workflows**: `.agents/workflows/` (multi-step orchestration)
- **Subagents**: Same-vendor native dispatch via Codex custom agents in `.codex/agents/{name}.toml`; cross-vendor fallback via `oma agent:spawn`

## Per-Agent Dispatch

1. Resolve `target_vendor_for_agent` from `.agents/oma-config.yaml`.
2. If `target_vendor_for_agent === current_runtime_vendor`, use the runtime's native subagent path.
3. If vendors differ, or native subagents are unavailable, use `oma agent:spawn` for that agent only.

## Code Search

Prefer **serena MCP** tools over native find/grep when locating code — they are symbol-aware and faster on large repos. Fall back to native Read / Glob / Grep only when serena is unavailable or for plain file content reads.

| Task | Preferred tool |
|------|----------------|
| Locate a symbol definition (class / function / variable) | `find_symbol` |
| Find references / callers of a symbol | `find_referencing_symbols` |
| Outline a file's top-level symbols | `get_symbols_overview` |
| Pattern or regex search across the codebase | `search_for_pattern` |
| Find a file by name | `find_file` |
| List directory contents | `list_dir` |

## Workflows

Execute by naming the workflow in your prompt. Keywords are auto-detected via hooks.

| Workflow | File | Description |
|----------|------|-------------|
| orchestrate | `orchestrate.md` | Parallel subagents + Review Loop |
| work | `work.md` | Step-by-step with remediation loop |
| ultrawork | `ultrawork.md` | 5-Phase Gate Loop (11 reviews) |
| plan | `plan.md` | PM task breakdown |
| brainstorm | `brainstorm.md` | Design-first ideation |
| review | `review.md` | QA audit |
| debug | `debug.md` | Root cause + minimal fix |
| deepsec | `deepsec.md` | Drive `oma-deepsec` end-to-end (setup / scan / pr-review / matchers / triage) |
| scm | `scm.md` | SCM + Git operations + Conventional Commits |
| docs | `docs.md` | Documentation drift verify + sync |
| recap | `recap.md` | Daily / period AI conversation recap |

To execute: read and follow `.agents/workflows/{name}.md` step by step.

## Auto-Detection

Hooks: `UserPromptSubmit` (keyword detection), `PreToolUse`, `Stop` (persistent mode)
Keywords defined in `.agents/hooks/core/triggers.json` (multi-language).
Persistent workflows (orchestrate, ultrawork, work) block termination until complete.
Deactivate: say "workflow done".

## Rules

1. **Do not modify `.agents/` files** (SSOT protection).
2. Workflows execute via keyword detection or explicit naming, never self-initiated.
3. Response language follows `.agents/oma-config.yaml`

## Project Rules

Read the relevant file from `.agents/rules/` when working on matching code.

| Rule | File | Scope |
|------|------|-------|
| backend | `.agents/rules/backend.md` | on request |
| commit | `.agents/rules/commit.md` | on request |
| database | `.agents/rules/database.md` | **/*.{sql,prisma} |
| debug | `.agents/rules/debug.md` | on request |
| design | `.agents/rules/design.md` | on request |
| dev-workflow | `.agents/rules/dev-workflow.md` | on request |
| frontend | `.agents/rules/frontend.md` | **/*.{tsx,jsx,css,scss} |
| i18n-guide | `.agents/rules/i18n-guide.md` | always |
| infrastructure | `.agents/rules/infrastructure.md` | **/*.{tf,tfvars,hcl} |
| market | `.agents/rules/market.md` | on request |
| mobile | `.agents/rules/mobile.md` | **/*.{dart,swift,kt} |
| quality | `.agents/rules/quality.md` | on request |

<!-- OMA:END -->
