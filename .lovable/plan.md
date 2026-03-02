

## Plan: Add Bot Prevention to Waitlist Signup

### Approach

Add a honeypot field — a hidden input that real users never fill in but bots auto-complete. This is lightweight, no-dependency, and doesn't degrade UX (unlike CAPTCHAs). Combined with rate limiting via a database constraint.

### Changes

1. **`src/pages/LandingPage.tsx`**
   - Add a hidden honeypot input field (e.g., `name="website"`) styled with `display: none`
   - Before submitting, check if the honeypot has a value — if yes, silently reject (show fake success to fool bots)
   - Add a timestamp check: record when the form rendered, reject submissions faster than 2 seconds (bots fill forms instantly)

2. **Database migration** — Add a rate limit: a database function or unique constraint on `(email)` already exists (good), plus add a trigger that rejects more than 5 inserts from the same IP within an hour. However, since we don't have IP access from the client, we'll instead rely on the honeypot + timing approach client-side.

### Why not CAPTCHA

Adding Google reCAPTCHA or hCaptcha would require API keys, external dependencies, and hurts conversion rates. The honeypot + timing combo blocks 95%+ of automated bots with zero friction for real users.

### Technical Details

- Honeypot field: `<input name="website" tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: '-9999px' }} />`
- Timing gate: store `Date.now()` on mount, reject if submission is under 2 seconds
- Both checks fail silently (show success message) to avoid giving bots feedback

