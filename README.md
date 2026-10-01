# OCM portfolio

The project has a Vue 3 client, a Pinia data layer, and an Express/MongoDB API. Public pages read projects, companies, categories, hero images, and videos from the server. The admin dashboard writes to the same records.

## Development

1. Copy `server/.env.example` to `server/.env` and configure MongoDB, `JWT_SECRET`, `ADMIN_USER_ID`, and a strong `ADMIN_PASSWORD`.
2. Install packages in `client` and `server` with `npm install`.
3. Run the API from `server` with `npm run dev`.
4. Run the client from `client` with `npm run dev`.

The website opens at `http://127.0.0.1:5173`. The dashboard is at `http://127.0.0.1:5173/admin`.

The Vite development server proxies `/api` and `/public` to `http://127.0.0.1:7050`. Set `BACKEND_TARGET` in `client/.env` if the API uses another address.

## Admin content order

Create a company and category first, then create a project and select both relationships. A project supports up to eight images and one optional video. Hero media supports a video, poster, and image; publishing a hero makes it the active homepage hero.

The server creates or synchronizes the configured admin account when it starts. Change the environment variables to rotate its credentials.

## Production

Run `npm run build` in `client`, set `NODE_ENV=production` in `server/.env`, configure the public domain in `CORS_ORIGINS`, and start the server with `npm start`. Express serves the built client and supports direct links such as `/admin/projects` and `/projects/project-slug`.

## Verification

- Client build: `cd client && npm run build`
- Server checks: `cd server && npm test`
- Isolated API integration check: `cd server && npm run test:integration`

The integration check creates a uniquely named temporary database, exercises login, CRUD, relationships, uploads, media range requests, and direct client routes, then removes its temporary database and uploaded fixtures.
