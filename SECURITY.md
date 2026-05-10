# Security policy

## Supported versions

Security fixes are applied on the active development branch (`main`) and tagged releases as appropriate. Use the latest tag when deploying.

## Reporting a vulnerability

Please report security issues **privately** so we can coordinate a fix before public disclosure.

- **Email:** overledgerer@protonmail.com  
- **Subject line:** `[SECURITY] bpvp-suite-v2`

Include:

- Description of the issue and impact  
- Steps to reproduce (proof-of-concept if possible)  
- Affected components (dashboard, wallet, engine, infra, etc.)  
- Your preferred disclosure timeline (if any)

We aim to acknowledge reports within **72 hours** and provide an initial assessment within **7 days**. Coordinated disclosure timelines depend on severity and fix readiness.

## Scope

In scope: this repository’s application code, Docker/dev configuration documented here, and CI workflows shipped in `.github/workflows/`.

Out of scope: third-party dependencies except where our usage introduces a direct exploit path (report anyway; we may redirect to upstream).

## Safe harbor

Good-faith security research that avoids harm to users and production systems is welcome. Do not access data that does not belong to you or perform disruptive testing without written agreement.
