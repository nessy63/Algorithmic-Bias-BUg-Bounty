# Privacy & Personal-Data Audit

Living document for the Algorithmic Bias Bug Bounty platform. It maps where user
personal data enters, travels, and ends up, and states the rules every code change
must follow so the platform stays compliant.

Scope: `backend/` (Express + Prisma), `frontend/` (Next.js), `sandbox/` (FastAPI).
Last reviewed: 2026-08-18.

---

## 1. Data flow map

### Collected data (collection points)

| Collection point | Data | Stored in | Where it goes |
|---|---|---|---|
| `POST /api/auth/register` (`backend/src/routes/auth.ts`) | email, password, name, role, company name/description | `User`, `Company` (DB) | Email → JWT payload → httpOnly cookie; email → Stripe only when payments are connected |
| `POST /api/auth/login` | email, password | — (bcrypt-verified only) | Email → JWT payload → httpOnly cookie |
| `PUT /api/users/profile` | name, bio, avatarUrl, githubUrl | `User`, `Researcher` | Account owner's dashboard; researcher display name shown to companies on bug reports |
| `POST /api/bugs` | title, description, repro steps, input/output examples, expected/actual behavior, severity | `BugReport` | Submitting researcher + target company |
| `POST /api/bugs/test` (sandbox) | test input, modelId, testType | not persisted | Backend → sandbox (`SANDBOX_API_URL`) → company's external model `apiEndpoint` |
| `POST /api/users/setup-payments` | company email | Stripe account id in `Company.stripeAccountId` | **Stripe** (required to create a Connect account) |
| Client IP | — | not stored | **Never logged** (morgan `real-ip` token is `[REDACTED]`; see §3) |

Not collected anywhere: device info, phone numbers, physical addresses, dates of
birth, payment card numbers (payments are Stripe-hosted).

### Where data ends up

- **Database (PostgreSQL, TLS required in production):** `User.email`,
  `User.passwordHash` (bcrypt, never recoverable), `User.name`, `Researcher`
  profile fields, company fields, bug report content.
- **Browser (frontend):** only an httpOnly `token` cookie. The zustand auth store is
  in-memory; **nothing is written to `localStorage`/`sessionStorage`**.
- **External services:** Stripe (email + account id for Connect), **Resend** (email
  address + bug-title/subject/amount — recipients are redacted in app logs),
  sandbox → model endpoints (test input). No analytics, error-tracking, or
  advertising SDKs.

---

## 2. API response filtering rules

No endpoint may return more than the client needs. Concretely:

- **Never return:** `passwordHash`, `stripeAccountId` (expose
  `stripeConnected: !!stripeAccountId` instead), researcher **emails**, JWT tokens
  in response bodies, or other users' data.
- **Avoid returning internal ids** (`companyId`, `modelId`, `researcherId`,
  `stripePaymentIntentId`) in nested objects on public/aggregate responses. When an
  authorization check needs an internal id (e.g. `bug.model.companyId`), look it up
  with a separate `select` query instead of including it in the payload.
- Use explicit Prisma `select`/nested `select` on every response. `include: true`
  on relations is only acceptable when the whole object is the caller's own data.
- `apiEndpoint` is intentionally public on model listings — the sandbox feature
  needs it to run tests. Do not remove it without updating
  `frontend/src/app/dashboard/sandbox/page.tsx`.
- Reviewer notes on bug reports must expose only the researcher's display name:
  `researcher: { select: { user: { select: { name: true } } } }`.

Reference implementations: `publicUser`/`publicProfile` in
`backend/src/routes/auth.ts` and `backend/src/routes/users.ts`; the trimmed
`select`s in `backend/src/routes/models.ts`, `routes/bugs.ts`, `routes/bounties.ts`.

---

## 3. Logging & redaction policy

Ground rule: **log files must never contain emails, passwords, tokens, IP
addresses, phone numbers, or full payment objects.**

| Surface | Rule |
|---|---|
| HTTP access logs (`backend/src/middleware/logger.ts`) | Path only (strip query strings); `real-ip` token must stay `[REDACTED]` |
| Application logs (`logger.*`) | Never log request bodies or submitted email/password; log `err.message` only for errors, never serialized error objects |
| Prisma client (`backend/src/config/database.ts`) | `query` logging must stay disabled — query events include parameter values |
| Email service (`backend/src/services/email.ts`) | Recipient logged as `to: '[REDACTED]'`; sends via Resend, skipped (not thrown) when `RESEND_API_KEY` is unset; user-provided values HTML-escaped before interpolation |
| Log viewer (`backend/src/routes/logs.ts`) | Defense-in-depth sanitizer must stay (email/JWT regex + sensitive-key redaction); viewer stays off unless `ENABLE_LOG_VIEWER=true` **and** the caller is an admin (ADMIN role or `ADMIN_EMAILS` env allowlist, via `requireAdmin` in `backend/src/middleware/auth.ts`) |
| Seed scripts / CLIs | Never `console.log` emails or passwords — print `[REDACTED]` |

**When adding a new log statement:** ask "could this string contain a person's
data?" If yes, redact it or drop the field. Audit events in
`backend/src/lib/audit.ts` must log `ip: '[REDACTED]'`, never the raw value.

---

## 4. Password policy

- Hash with **bcrypt, 12 rounds** (`BCRYPT_ROUNDS` in `backend/src/config/auth.ts`).
  Never MD5/SHA-256 alone, never a reversible cipher.
- Plaintext passwords must only ever reach the hashing/compare functions
  (`bcrypt.hash` / `bcrypt.compare`). Never stored, logged, or returned.
- On account deletion, replace the stored hash with a hash of a random value so
  captured credentials can never be reused.

## 5. Cookies & browser storage policy

- Auth sessions use the `token` cookie with **`httpOnly`, `secure` (production),
  `sameSite: 'lax'`** — see `tokenCookieOptions()` in `backend/src/routes/auth.ts`.
- The JWT is delivered **only** via that cookie — never in a response body (page JS
  and XSS must not be able to read it).
- No user PII in `localStorage`/`sessionStorage`. If new client-side state is
  needed, keep it in the in-memory zustand store.

## 6. Data deletion

`DELETE /api/users/account` (`backend/src/routes/users.ts`) is the single deletion
flow, exposed as "Delete My Account" in dashboard Settings:

- Email → `deleted-<id>@anonymized.invalid`, name → `Deleted User`, password hash
  → unusable random hash.
- Researcher: bio/avatar/github cleared, reputation/earnings zeroed, notes on own
  reports removed.
- Company (sole member): name/slug anonymized, Stripe account unlinked.
- Session cookie cleared.

Bug report *content* and financial records are intentionally retained as business
records (stated in the Settings UI copy). Any change to this behavior must be
documented here.

---

## 7. Checklist for new features

- [ ] Every new endpoint returns a Prisma `select`, not full rows (`include: true` on relations justified?).
- [ ] No password hash, email, token, internal id, or other-user data in the response.
- [ ] No new `console.log`/`logger` line that could emit PII; IPs redacted.
- [ ] Auth changes keep the token in the httpOnly cookie only.
- [ ] No new third-party SDK without reviewing what data it receives and stripping extras (see §1 "External services").
- [ ] New collected fields covered by account deletion (or explicitly documented as retained business records).
- [ ] Frontend stores nothing user-identifying in `localStorage`.
