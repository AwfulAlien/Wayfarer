This Angular application is the frontend for the Wayfarer travel consultation demo. See the project-level `../README.md` for setup, configuration, tests, and deployment.

## Cloudflare deployment

This frontend is published as a **Cloudflare Pages** site. The `*.pages.dev` hostname identifies Pages; `npx wrangler deploy` is the Workers deployment command, so it can successfully publish a Worker without updating this Pages site. That mismatch explains why a deployment can report success while the Pages URL continues to return 404.

The Angular application builder writes the browser entry point to `dist/date-time/browser/index.html`. Deploy that directory, not its parent `dist/date-time`.

### Cloudflare Pages Git integration

Use these build settings for the Pages project `wayfarer`:

| Setting | Value |
| --- | --- |
| Root directory | `/` when the connected repository is this frontend repo; `/frontend` when the connected repository is the monorepo root |
| Build command | `npm run build` |
| Build output directory | `dist/date-time/browser` |
| Deploy command | None; Pages publishes the build output automatically |

Do not run `npx wrangler deploy` for this Pages project. If Cloudflare's selected build interface requires a custom deploy command, use `npm run deploy:cloudflare` instead; it runs `npx wrangler pages deploy dist/date-time/browser --project-name wayfarer`.

Production builds default to the deployed Spring Boot origin `https://wayfarer-api-p4by.onrender.com`; set `FRONTEND_API_BASE_URL` in Cloudflare to override it when the backend URL changes. This is public browser configuration, not a secret. Local `npm start` keeps the API base empty and continues using `proxy.conf.json` to reach `http://localhost:8080`. Keep `GEMINI_API_KEY` only in the backend environment.

Cloudflare Pages serves `index.html` for unmatched paths when the output has no top-level `404.html`, which is the SPA fallback Angular needs for client-side routes. The current build has no `404.html`. If one is added later, preserve the SPA fallback intentionally.

### Deploy from a local checkout

From this `frontend/` directory:

```sh
npm ci
npm run build
npm run deploy:cloudflare
```

The last command requires Wrangler authentication for the Cloudflare account containing the existing Pages project `wayfarer`. A successful Worker deploy is not proof that the Pages site was updated. After the Pages deploy, verify the Pages URL and a client-side route directly.
