# SmartCart Web

Angular frontend for SmartCart, an e-commerce platform with AI-assisted shopping. It talks to
the [`smartcart-backend`](../smartcart-backend) REST API (which itself delegates AI features to
`smartcart-ai-service`) and covers customer, merchant, and admin experiences in a single app.

## Features

- **Customer storefront** — home, search results, product detail, cart, checkout, order confirmation (`src/app/pages`)
- **Auth** — login/signup flows and route guards (`src/app/pages/auth`, `src/app/security`)
- **AI chat assistant** — chat widget backed by the AI service (`src/app/features/chat`)
- **Merchant portal** — product and order management for merchants (`src/app/pages/merchant`, `src/app/layout/merchant-layout`)
- **Admin portal** — dashboard, admin accounts, merchants, products (`src/app/admin`)
- **Shared UI** — nav bar and other reusable components (`src/app/shared`)

## Tech Stack

- Angular 22 (standalone app builder, `@angular/build`)
- TypeScript, RxJS
- Vitest (unit tests, with V8 coverage)
- Prettier (formatting)
- Nginx (production serving), Docker
- SonarCloud (code quality/coverage)

## Project Structure

```
src/app/
├── admin/          # Admin portal: dashboard, admins, merchants, products
├── features/chat/  # AI chat assistant widget
├── layout/         # Customer/merchant/admin shell layouts
├── models/         # Shared TypeScript models
├── pages/          # Customer-facing routed pages (home, cart, checkout, auth, ...)
├── security/        # Auth guards/interceptors
├── services/        # Shared API/data services
└── shared/          # Reusable components (nav bar, etc.)
src/environments/     # Environment configs (dev/prod API URLs)
src/proxy.conf.json    # Dev-server proxy to the backend (/api, /images)
```

## Prerequisites

- Node.js (see `@angular/cli` ^22.1 requirement) and npm
- A running [`smartcart-backend`](../smartcart-backend) instance (default `http://localhost:8080`)

## Setup

```bash
npm install
```

## Running Locally

```bash
npm start
```

This runs `ng serve` in development mode, proxying `/api` and `/images` requests to
`http://localhost:8080` (see `src/proxy.conf.json`), so make sure the backend is running first.
The app is served at `http://localhost:4200`.

## Testing

```bash
npm test
```

Runs unit tests via Vitest and generates coverage (`coverage/temp-web/lcov.info`), consumed by
SonarCloud in CI.

## Building

```bash
npm run build
```

Production build output goes to `dist/temp-web/browser`. Use `npm run watch` for an unoptimized,
sourcemapped development build that rebuilds on change.

## Docker

```bash
docker build -t smartcart-web .
docker run -p 8080:8080 smartcart-web
```

The image builds the app with Node, then serves the static output with Nginx (`nginx.conf`),
proxying `/api/` to a `backend` host on port 8080 — matching the service name used in
`smartcart-backend`'s `docker-compose.yml`, which builds this app as its `frontend` service.

## Related Repositories

- [`smartcart-backend`](../smartcart-backend) — Spring Boot REST API
- `smartcart-ai-service` (nested under `smartcart-backend`) — Python AI microservice for recommendations, vector search, and chat

## License

No license specified.