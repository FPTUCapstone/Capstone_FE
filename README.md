# TripMate Frontend

TripMate is a smart travel planning and travel services platform. This repository contains its responsive Next.js Web application.

## Project Scope

The approved Web product model contains four areas:

- **Public Web:** the landing page and supported Guest discovery and account flows.
- **Traveler Web:** Traveler functions classified as shared Web/Mobile by the approved SRS.
- **Tour Operator Web:** Tour Operator functions classified as shared Web/Mobile by the approved SRS.
- **Administrator Web:** the Web-only administration workspace.

Some active-trip and device-dependent functions remain Mobile-only in the separate Flutter application. The canonical use-case boundary is documented in [`docs/WEB_SCOPE_MATRIX.md`](docs/WEB_SCOPE_MATRIX.md). `src/legacy/mobile` contains historical visual references only; its files are not production Web routes and do not determine platform ownership.

## Technology Stack

- Next.js 16 with the App Router
- React 19
- TypeScript 5
- Tailwind CSS 4
- ESLint 9 with the Next.js configuration
- npm

## Project Structure

```text
app/                         Next.js routes, layouts, metadata, and global styles
  admin/
    login/                   Administrator login placeholder
    (console)/               Administrator dashboard and tour-review routes
src/
  components/                Shared brand, navigation, and UI components
  data/                      Current mock and prototype data
  features/
    public/                  Current Public Landing Page feature
    admin/                   Current Administrator dashboard and tour-review features
  legacy/mobile/             Historical, non-routed visual references
  lib/                       Shared route definitions
  types/                     Shared TypeScript types
```

## Getting Started

### Prerequisites

- Node.js 20.9 or later
- npm

### Installation

```bash
git clone https://github.com/FPTUCapstone/Capstone_FE.git
cd Capstone_FE
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in a browser.

## Available Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server on port 3001. |
| `npm run build` | Create an optimized production build. |
| `npm run start` | Serve the production build on port 3001. |
| `npm run lint` | Run ESLint across the repository. |
| `npm run typecheck` | Run TypeScript checks without emitting files. |

## Environment Variables

The current visual prototype does not require runtime environment variables. The committed `.env.example` is a placeholder for future server-only API and authentication settings, and it does not contain variable names or secrets.

When variables are introduced, create a local Next.js environment file with:

```bash
cp .env.example .env.local
```

Do not commit `.env.local` or any secret values.

## Application Architecture

The SRS permits future approved feature modules under `src/features/public`, `src/features/traveler`, `src/features/operator`, and `src/features/admin`. Directories and routes are created only when an approved feature is implemented; this repository currently implements only the routes listed below.

### Public Web

- `/` — Public Landing Page
- `/sign-in` — Public Traveler and Tour Operator sign-in prototype
- `/register` — Traveler registration prototype
- `/verify-account` — Traveler account verification prototype
- `/forgot-password` — Progressive public password-recovery prototype

### Tour Operator Web

- `/partner/register` — Tour Operator registration and Application Submitted state
- `/partner/application` — Pending Review, Rejected, and Approved application-status variants
- `/partner/application/resubmit` — Rejected-application correction and resubmission prototype

### Admin Web

- `/admin/login` — Administrator sign-in prototype
- `/admin/forgot-password` — Progressive Administrator password-recovery prototype
- `/admin` — Administrator dashboard
- `/admin/tours/reviews` — Mock tour-review queue
- `/admin/tours/reviews/[id]` — Mock tour-review detail and decision UI

The Admin Web is intended to be a protected administration system. Authentication and authorization are not yet integrated, so the current routes remain prototype screens.

### Wider TripMate architecture context

- **Backend:** A separate ASP.NET Core / .NET 8 Web API is planned outside this repository; this frontend is not currently connected to it.
- **Mobile:** A separate Flutter application serves supported Guest, Traveler, and Tour Operator functions, including Mobile-only navigation, offline, travel-group, commercial-service, and QR-scanning experiences.

## Current Development Status

### Implemented

- Next.js App Router project structure
- Public Landing Page
- Public and Administrator authentication and password-recovery flows
- Traveler registration and account verification
- Tour Operator registration, submission, application status, and resubmission flows
- Administrator layout, dashboard, tour-review queue, and review detail routes
- Responsive styling and shared Web components

### Prototype / mock

- Batch 1 account forms, status variants, validation, loading, error, and success behavior
- Tour-review data and moderation interactions
- Content used by the current public, partner, and admin screens

### Planned / not yet integrated

- Remaining approved Traveler, Tour Operator, Public, and Administrator Web screens identified by the Web scope matrix
- Real authentication and route protection
- Backend API integration and persistent data
- Production environment configuration
- Live platform services such as maps and payments

## Git Repository

Official repository: [https://github.com/FPTUCapstone/Capstone_FE](https://github.com/FPTUCapstone/Capstone_FE)

## Contribution Workflow

1. Pull the latest changes from the official repository.
2. Create or use the branch assigned to the task.
3. Implement the scoped change.
4. Run `npm run lint` and `npm run build`.
5. Commit with a meaningful message.
6. Push the branch.
7. Open a Pull Request for review.
