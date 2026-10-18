# Security

## Reporting

Please report a vulnerability privately through
[GitHub Security Advisories](https://github.com/fabwaseem/benchline/security/advisories/new).

Do not open a public issue for a vulnerability, and do not post an exploit against the live site. Include the route, the request that shows the problem, and the effect. You will get a reply on the advisory.

## Scope

In scope:

- The site at `https://benchline.fabwaseem.com`, including `/mcp` and `/api/v1/tools/<slug>`.
- The SSRF guards on tools that fetch a URL. That is `src/lib/net/ssrf.ts` for browser checker routes, and the same checks inside `readMcpBytes` for MCP file URLs. A report that reaches a loopback, private, link-local, or metadata address is in scope.
- Authentication bypass on the MCP origin check, and any path that stores or returns someone else's input. The app is stateless and stores no accounts.

Out of scope:

- Volume against the published rate limits, without a bypass.
- Missing headers on a third-party site that a checker reports.
- Social-engineering of the repository owner.

## Supported versions

`main` is the supported line. There are no versioned releases. Fixes land on `main` and ship with the live site.
