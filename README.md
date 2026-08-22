# TripMate Frontend

TripMate is a smart travel planning and travel services platform. This repository contains its public-facing website and Administrator Web Application.

## Project Scope

The frontend is divided by platform:

- **Web:** Public Landing Page and Administrator Web Application, implemented in this repository with Next.js.
- **Mobile:** Traveler and Tour Operator applications are developed separately with Flutter and are not part of this Web application. `src/legacy/mobile` contains visual reference components only; they are not production Web routes.

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
    public/                  Public Landing Page feature
    admin/                   Administrator dashboard and tour-review features
  legacy/mobile/             Non-routed Flutter UI visual references
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

### Public Web

- `/` — Public Landing Page

### Admin Web

- `/admin/login` — Login UI placeholder
- `/admin` — Administrator dashboard
- `/admin/tours/reviews` — Mock tour-review queue
- `/admin/tours/reviews/[id]` — Mock tour-review detail and decision UI

The Admin Web is intended to be a protected administration system. Authentication and authorization are not yet integrated, so the current routes remain prototype screens.

### Wider TripMate architecture context

- **Backend:** A separate ASP.NET Core / .NET 8 Web API is planned outside this repository; this frontend is not currently connected to it.
- **Mobile:** A separate Flutter application serves Traveler and Tour Operator roles. Only legacy visual references are preserved here.

## Current Development Status

### Implemented

- Next.js App Router project structure
- Public Landing Page
- Administrator layout, dashboard, tour-review queue, and review detail routes
- Responsive styling and shared Web components

### Prototype / mock

- Administrator login interface
- Tour-review data and moderation interactions
- Content used by the current public and admin screens

### Planned / not yet integrated

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
