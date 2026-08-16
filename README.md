# TokenWatch Frontend

Next.js dashboard for TokenWatch usage, API-key metadata, and alert management.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000`.
3. Install dependencies with `npm install`.
4. Start with `npm run dev` and open `http://localhost:3000`.

Only the non-secret backend base URL belongs in a `NEXT_PUBLIC_` variable. Never place credentials or server keys in browser-visible environment variables.

## Validation

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Production builds require an HTTPS `NEXT_PUBLIC_API_BASE_URL`. Localhost HTTP is accepted for development.

Registration, password reset, and account settings use the same password policy: at least 5 characters with one uppercase letter, one number, and one special character. Email verification remains required; when the backend cannot confirm delivery, the UI must show a delivery warning rather than claiming that mail was sent.
