# Phase 4 analytics rollout

Phase 4 adds consent-gated, provider-neutral product analytics for the Global
University Journey. The application stays fully functional when analytics is
disabled, blocked by the browser, or not configured.

## Railway configuration

Set these public frontend variables on the Railway web service:

- `VITE_ANALYTICS_ENABLED=true`
- `VITE_GA4_MEASUREMENT_ID=<GA4 web stream measurement ID>`
- `VITE_POSTHOG_KEY=<PostHog project key>`
- `VITE_POSTHOG_HOST=https://us.i.posthog.com` (or the region shown by PostHog)

Redeploy after changing a `VITE_` variable because Vite embeds public values at
build time. Leave `VITE_ANALYTICS_ENABLED=false` until the production projects
and privacy wording are approved.

## Funnel and retention events

- Acquisition: `landing_viewed`, `signup_started`, `signup_completed`
- Activation: `onboarding_started`, `onboarding_completed`,
  `first_value_reached`
- Retention: `app_session_started`, `study_session_started`
- Revenue intent: `upgrade_viewed`, `upgrade_started`
- Navigation: `page_viewed` with normalized `path` and `area`

Every event includes sanitized first-touch and last-touch UTM, creator, partner
and referral attribution when available. Query strings, emails, names, tokens,
free-form answers and document content are not event properties.

## Privacy contract

- GA4 and PostHog do not load before explicit analytics consent.
- Advertising storage, user data and personalization remain denied in GA4.
- PostHog identifies users only by internal ID; email and full name are never
  sent by this integration.
- Session replay masks every input and text node, strips query strings, blocks
  private elements and stops on authentication, onboarding, account, profile,
  writing and AI Coach routes.
- The persistent shield control lets a learner change or revoke consent.
