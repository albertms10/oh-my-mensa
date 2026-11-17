# AGENTS.md

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project overview

This project is an Allergen Analytics web application built with Next.js. It visualizes menu and allergen data retrieved from MaxManager.

The application provides:
- Allergen statistics and trends.
- Location and meal-group comparisons.
- Date and allergen filtering.
- Dish-level exploration.
- Identification of dishes without configured allergens.

## Technology and architecture

- Use Next.js App Router and TypeScript.
- Use strict TypeScript typing.
- Use Tailwind CSS for styling.
- Use Recharts for data visualization.
- Prefer Lucide icons.
- Use Zod to validate external API data.
- Keep business logic separate from React components.
- Prefer server components unless client-side interactivity is required.

## Critical: CORS and security

- Never fetch MaxManager directly from browser-side code.
- All external MaxManager requests must happen server-side.
- Use Next.js Route Handlers as the frontend API boundary.
- Never expose API credentials, cookies, tokens or secrets to client components.
- Store configuration in environment variables.
- Never disable CORS security or rely on public CORS proxies.
- Validate external data before using it.
- Do not expose internal server errors or credentials in API responses.

## Data provider architecture

Keep the MaxManager integration isolated behind a provider abstraction.

Support:
- Mock data provider for local development.
- Real MaxManager provider for production.

The application must work without MaxManager credentials in mock mode.

Do not invent MaxManager endpoints, authentication methods or response structures. If API details are unavailable, document what is needed rather than guessing.

Do not silently fall back to mock data when a real provider fails. Make the active data source clear and display errors appropriately.

## Allergen business rules

The configured allergen categories are:

| Category | Matching source codes |
|---|---|
| Gluten | `Gl*` |
| Nuts | `Nu*` |
| Milk | `La` |
| Egg | `Ei` |
| Soy | `So` |
| Celery | `Sl` |
| Mustard | `Sf` |
| Sesame | `Se` |

Centralize allergen matching logic. Never duplicate matching rules across components.

Counting rules:
- Count each dish at most once per allergen category.
- A dish may count toward multiple categories.
- Category counts are not mutually exclusive and must not be presented as unique dish counts.
- A dish is allergen-free only if it contains none of the eight configured categories.
- Preserve original source allergen codes for inspection.
- Do not describe a dish as medically safe or universally allergen-free.

## Data processing

Keep aggregation and filtering functions in reusable, independently testable modules.

Support:
- Counts per day.
- Counts per allergen category.
- Counts per meal group.
- Counts per location.
- Allergen-free dish counts.
- Date, location, meal-group and allergen filtering.

Handle empty datasets, missing values, duplicate codes and missing menu days gracefully.

Dates must be sorted chronologically.

## UI and UX principles

- Build a professional, clean analytics dashboard.
- Prioritize readability and useful data presentation.
- Support desktop, tablet and mobile.
- Use consistent chart colors and formatting.
- Provide loading, empty and error states.
- Make filters affect all relevant visualizations and tables.
- Ensure accessible contrast and meaningful chart labels.
- Avoid unnecessary visual decoration.

## Code quality

- Keep components focused and reusable.
- Avoid duplicated business logic.
- Avoid unnecessary dependencies.
- Use clear naming and explicit types.
- Validate external inputs.
- Add tests for business-critical aggregation and filtering logic.
- Run lint, TypeScript checks, tests and production builds after substantial changes.
- Fix errors introduced by your changes.

## Agent workflow

- Inspect the existing codebase before making changes.
- Follow established project conventions.
- Do not recreate the Next.js project.
- Do not stop at a plan when asked to implement a feature.
- Implement, test and verify changes.
- Update README.md when architecture, configuration or setup instructions change.
- Document assumptions and unresolved integration requirements.
