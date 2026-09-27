# X-CAPITAL authentication

X-CAPITAL is a **simulation**. Accounts hold virtual sUSDC only. There is no live deposit, withdrawal, or broker payout path.

## User desk

- URL: `/auth/login` and `/auth/register`
- Methods: email + password, Google, or Apple
- First action after login: claim the Genesis allocation (virtual capital) in Treasury

Google and Apple require `GOOGLE_CLIENT_ID` / `APPLE_SERVICE_ID` on the API and the matching `NEXT_PUBLIC_*` values on the static frontend. Create those credentials in Google Cloud Console and Apple Developer; they are not shipped in this repo.

## Admin

- URL: `/admin/login`
- Access is granted only to emails listed in the server `ADMIN_EMAILS` environment variable
- Admins can list accounts, create operators, and disable users
- Admins **cannot** mint balances, set profit multipliers, or approve real-money transfers

## Credential rotation

If this repository previously documented plaintext demo or admin passwords, treat them as compromised. Rotate:

1. Every password for accounts that used those credentials
2. `JWT_SECRET`
3. Any third-party API keys that lived in the same docs

Do not commit passwords.

## Session

- Access token: JWT, default 7 days
- Refresh token: 30 days, rotated on use
- Client stores tokens in `localStorage` (`xc_access_token`, `xc_refresh_token`)
- Social-only accounts have no `passwordHash`; email login returns “This account uses Google/Apple sign-in”
