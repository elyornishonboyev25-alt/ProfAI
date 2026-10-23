# Ivygoo domain migration

The public website and browser API/WebSocket requests use `https://ivygoo.com`.
The web service starts with `npm run start:web`. Set `API_UPSTREAM` to the private
backend endpoint (`http://prof-ai.railway.internal:5001` in this environment).
Frontend build variables `VITE_API_URL` and `VITE_API_BASE_URL` must both be
`/api/v1`; backend `CORS_ORIGIN` and `BILLING_SITE_URL` are `https://ivygoo.com`.

The old website domain serves permanent 308 redirects, preserving paths and
query strings. It must remain registered and routed to the web service for
Google to transfer the old search signals. It does not serve a second website.
Do not delete the old DNS/domain mapping as a way to remove the old brand.
Google recommends retaining redirects for at least a year:
https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes

Internal persisted storage keys and database/account IDs retain their original
identifiers so saved work, attempts and accounts are not renamed or lost.
Existing user-authored content is not migrated in the database.

Both public sign-in and account creation use the same Gmail code flow. The
browser never sends a password. Requesting a code does not create a user;
successful verification reuses the existing email identity or creates one new
account. Existing password hashes, progress and account IDs remain intact.
The public form has no password fields. Google sign-in is an additional option
on both account forms, and the guest homepage requests Google's own One Tap
chooser after 2.5 seconds, at most once per tab session. Google/browser settings
determine whether the chooser is eligible to appear; no account picker is
imitated by the app. Legacy API endpoints remain compatible while older browser
versions finish updating.

## Owner account setup

- Search Console: verify the new domain property using Google's DNS TXT record,
  submit `https://ivygoo.com/sitemap.xml`, inspect the new homepage and request
  indexing, then submit Change of Address from the verified old property.
  Search results update asynchronously; placement and timing are not guaranteed.
- Resend: verify `ivygoo.com` with the provider's exact DNS records before
  changing `AUTH_EMAIL_FROM` to `Ivygoo <accounts@ivygoo.com>`. Until verified,
  keep the existing verified sender to avoid interrupting verification emails.
  Only the display name and message content can be changed without DNS setup.
- Cloudflare SSL/TLS is Full with the existing root CNAME proxied. To support
  `www.ivygoo.com`, add a proxied `www` CNAME to `ivygoo.com`, then use a 301/308
  redirect to the apex, preserving path and query string.

Validation: `npm run test:web-server`, `npm run build`, backend TypeScript build,
browser checks on desktop/mobile, live auth config and CORS preflight requests.
