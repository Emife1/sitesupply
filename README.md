# SiteSupply

SiteSupply is an early-access construction sourcing and supplier-matching platform focused first on Ontario, Canada.

## Production surfaces

- Public site: `https://sitesupply.vercel.app`
- Health endpoint: `/api/health`
- Quote intake: `/compare`
- Supplier onboarding: `/suppliers`
- Workspace: `/workspace`

## Architecture

- Static, multi-page public frontend using semantic HTML, Inter typography, and vanilla JavaScript
- Vercel serverless API routes under `api/`
- Dedicated Neon PostgreSQL database
- Least-privilege application role with database functions for public submissions
- GitHub Actions validation for HTML entry points, JavaScript syntax, and launch metadata

## Local development

```bash
npm install
npm test
npx vercel dev
```

Required environment variables:

- `DATABASE_URL`: restricted pooled Neon connection string
- `RATE_LIMIT_SALT`: secret used to hash request-source identifiers
- `SITE_URL`: canonical public URL

Never commit credentials or production submission data.

## Product boundaries

The public request, supplier application, and contact workflows are production-connected. Pricing and supplier-fit values shown inside the workspace are explicitly demonstration data until real supplier responses are available.
