# Good Tree Help Assistant — Product Decisions

This document records the controlling decisions for the Help Assistant implementation.

## Architecture

- **Closed-book KB only**: Models route to approved content; the server renders approved text verbatim.
- **Retrieval**: Full-corpus Voyage `rerank-2.5` (no embeddings cache).
- **Verification**: OpenAI `gpt-4o-mini` accepts/rejects rank-1 only; never writes user-facing prose.
- **Two vendors** (Voyage + OpenAI) kept deliberately for calibrated relevance scores.

## Access & surfaces

- Help chat is always available on create-trust, dashboard, funding, and `/help` for logged-in users.
- **Public marketing routes** do not mount the assistant.

## Escalation

- **Tier 1**: Urgent — email admins via editable list; never quote user question text.
- **Tier 2**: Consult required — may block the current app step until consult path is followed.
- **153** non-`N/A` escalation conditions (deterministic triggers in code).

## Governance

- New KB entries start as `needs_revision`.
- **Scholar-flagged** and **policy-blocked** cards require publication gates before servability.
- Admin bulk approve skips gated entries.

## Providers

Set `HELP_PROVIDERS_VERIFIED=true` only after:

1. Voyage opt-out / no-training configuration confirmed
2. OpenAI Zero Data Retention enabled for the verifier project
3. Every active admin account has a deliverable email address

## Release gates

- Measured error rate below 5% on labelled evaluation set
- Zero Tier 1 false negatives in release set
- Threshold version stored with release (`HELP_RERANK_THRESHOLDS_VERSION`)
