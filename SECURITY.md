# Security policy

Report suspected vulnerabilities privately through the SiteSupply contact channel. Do not open a public issue containing credentials, personal information, database content, or exploit details.

## Current controls

- Vercel environment variables for secrets
- Dedicated Neon project and restricted application role
- Parameterized SQL via the Neon serverless driver
- Database-level submission functions and rate limits
- Honeypot fields and request-size limits
- Security headers and branch CI validation

## Supported version

Only the current production deployment from the `main` branch is supported.
