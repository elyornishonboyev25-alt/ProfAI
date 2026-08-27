# AI security and provider operations

Phase 1 moves every browser-originated generative AI request behind the
authenticated API boundary. The browser bundle must never contain Gemini,
OpenAI or Hugging Face credentials.

## Provider order

The backend tries providers in this order:

1. Gemini, rotating through configured models and keys.
2. OpenAI when `OPENAI_API_KEY` is configured.
3. Hugging Face when `HF_ACCESS_TOKEN` is configured and the request is
   text-only.

Image requests are never downgraded to a text-only provider. Provider failures
return a generic public message; credentials and upstream response bodies are
not exposed to the client.

## Required hosting configuration

Configure at least one provider secret in the backend service environment.
Gemini is the primary production default:

- `GEMINI_API_KEY` (one key or a comma-separated list)
- `GEMINI_API_KEY_2` through `GEMINI_API_KEY_5` (optional)
- `GEMINI_MODELS` (ordered, comma-separated model list)
- `OPENAI_API_KEY` (optional fallback)
- `HF_ACCESS_TOKEN` (optional text-only fallback)
- `AI_PROVIDER_TIMEOUT_MS` (default `30000`)
- `AI_RATE_LIMIT_MAX` (authenticated requests per minute, default `30`)

Do not use a `VITE_` prefix for any secret. Vite-prefixed values are public by
design and are compiled into the browser bundle.

## Usage ledger and privacy

Migration `20260827120000_add_ai_usage_events` creates the privacy-safe
`AiUsageEvent` ledger. It stores provider, model, purpose, status, latency,
character counts and provider token counts when available. It never stores
prompts, student responses, documents or image data.

Deploy the migration only after completing and verifying a production database
backup. Logging is best-effort during rolling deployment so AI traffic is not
interrupted if application instances restart before the migration finishes.

## Secret rotation checklist

The repository owner must rotate any credential that existed in a previously
tracked environment file:

- production database password/connection string;
- JWT access and refresh secrets (this invalidates existing sessions);
- Gemini, Hugging Face and OpenAI keys that were ever stored locally or in Git;
- other third-party credentials present in the old file.

Put replacements directly in the hosting provider's encrypted environment
settings, never in chat or a committed file. The local `backend/.env` remains
ignored for development convenience.

## Verification

Run from the repository root:

```powershell
npm.cmd --prefix backend run build
npm.cmd --prefix backend run test:ai-security
npm.cmd run build
rg -n "VITE_GEMINI|GEMINI_API_KEY|generativelanguage.googleapis.com" src dist .env.example vite-env.d.ts
```

The final search must return no frontend or built-bundle matches.
