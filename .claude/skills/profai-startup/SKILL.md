---
name: profai-startup
description: How to work on the ProfAI (Ivygoo) startup as a professional co-founder-level agent. Use for ANY task in this repo or about ProfAI — features, bug fixes, IELTS/SAT content, design, marketing images, pitch decks, PDFs, presentations, landing pages, growth, Telegram bot. Covers how to read the founder's short Uzbek requests, the stack, quality bar, which skill to pick for images/PDF/slides/docs, and the commit+push rule.
---

# ProfAI startup agent

ProfAI (internal package name `ivygoo`) is an EdTech startup: SAT + IELTS prep, AI coaching and admission help for students targeting universities abroad. The founder writes short, fast Uzbek messages (often Latin script without apostrophes, e.g. "kk" = kerak, "bulsa" = bo'lsa, "urnat" = o'rnat). Treat every request as coming from a founder who wants the result shipped, not discussed.

## 1. Understanding the request

- Always reply in Uzbek (Latin), short and clear. Code, commits and UI copy stay in the project's languages (EN/UZ/RU via i18n).
- Expand informal spelling silently; never ask the founder to rephrase. Common forms: `kk`=kerak, `qil`=do it, `tugat`=finish fully, `zur/zo'r`=great, `ishlamayapti`=broken, `chiroyli`=polished design, `profesional`=production quality.
- "Professional qilib tugat" means: finished end to end, tested, translated (i18n), mobile-friendly, committed and pushed. Not a draft.
- If the request is ambiguous, pick the most sensible interpretation for a student-facing product, state the assumption in one line, and proceed. Ask only when the choice changes the product (pricing, deleting data, brand change).
- Screenshots/photos the founder sends are specs: reproduce them faithfully (for IELTS maps/diagrams use inline SVG, never raster — see AGENTS.md).

## 2. Stack and where things live

- Frontend: Vite 6 + React 18 + TypeScript + Tailwind 3, react-router 6, zustand stores, i18next, framer-motion, lenis, recharts/chart.js, PWA. Deployed on Vercel.
- Backend: `backend/` Express + Prisma (Postgres), JWT auth, WebSocket, deployed on Railway. New tables need a Prisma migration in `backend/prisma/migrations/`.
- Pages: `src/pages/`, features: `src/features/`, content banks: `src/data/` (IELTS, SAT, articles, podcasts, admission), styles: `src/styles/`.
- Validation scripts run in `npm run build` (`check:i18n`, `validate:*`). When adding content or UI strings, run the matching validator; when changing a test flow, run the matching `test:*` script from `package.json`.
- Never rename `smarttest-` localStorage keys (users lose data). Never commit API keys; AI keys live in env variables.

## 3. Quality bar

- Match existing patterns before inventing new ones (look at the nearest sibling page/component first).
- Every user-visible string goes through i18n in all three languages.
- Check mobile width (375px) and that nothing scrolls horizontally.
- Verify in the browser preview when the change is visible; use the project's test scripts for logic.
- Duplicates: before adding an IELTS/SAT test, search `src/data` for it (AGENTS.md rule).

## 4. Picking the right tool for non-code deliverables

| Founder asks for | Use |
|---|---|
| Pitch deck, taqdimot, slaydlar | Artifact quickstart `slides` (Slides type); `.pptx` only if they name PowerPoint → `anthropic-skills:pptx` |
| PDF (hisobot, sertifikat, flyer) | `anthropic-skills:pdf` |
| Word hujjat / shartnoma | `anthropic-skills:docx`; a shareable doc without a format → `anthropic-skills:docs` |
| Excel / moliyaviy model / jadval | `anthropic-skills:xlsx` |
| Grafik, dashboard, metrika | `dataviz` skill, then Artifact |
| Bozor tahlili, raqobatchilar, investorlar | `anthropic-skills:deep-research` |
| Rasm, logo, banner, social post | Canva / Hyper Marketing / Superdesign plugin if enabled; otherwise hand-built SVG or HTML artifact in the ProfAI brand (logo from `src/components/brand/BrandLogo.tsx` / `public/logo.svg`) |
| Ovoz, voiceover | ElevenLabs connector (`creative_generate_speech`) |
| UI dizayn, redesign | `frontend-design` / `Design` plugin if enabled, else `artifact-design` principles |
| Video promo | Remotion project in `D:/Smat Test and Python/ProfAI-Video` |

Brand: name is ProfAI, tagline "Your Path to Top Universities Abroad". Logo = red graduation cap with a world map and an "AI" tassel; if it changes, update both `BrandLogo.tsx` and `public/logo.svg`. Audience: students in Uzbekistan / CIS aiming for universities abroad; SAT/IELTS/vocab are tools toward that goal. Tone: confident, ambitious, warm. Pricing: Free $0 / Pro $6 / Max $12 (`billingCatalog.ts`).

## 5. Finishing

1. Run the relevant validator/test; report failures honestly with the output.
2. Commit only the files changed for this task (never photos, `artifacts/`, `output/`, `.env`, local settings or unrelated modified files).
3. Push the current branch to its upstream. If push is blocked, say why — never force-push.
4. Reply in Uzbek: what changed, where, how it was checked, and anything left.
