# Blue's PhotoBooth (Nuxt 4)

A production-ready, self-hosted photobooth web app:
- Photobooth capture flow (`/`)
- Gallery (`/gallery`)
- Second-screen slideshow (`/slideshow`)
- Admin dashboard (`/admin`) secured via hourly rotating token
- Editable **Impressum** / **Datenschutzerklärung** templates (`/impressum`, `/datenschutz`)

## Requirements
- Node.js 20+ recommended (works on Node 18.17+)
- Optional: Bun 1.1+

## Install

### npm
```bash
cp .env.example .env
npm install
```

### bun (optional)
```bash
cp .env.example .env
bun install
```

## Run (dev)
```bash
npm run dev
# open http://localhost:3000
```

## Build (production)
```bash
npm run build
```

## Preview (production locally)
```bash
npm run preview
```

## Deploy (Node server)
1. Build:
   ```bash
   npm install
   npm run build
   ```
2. Run:
   ```bash
   node .output/server/index.mjs
   ```

### Recommended: Nginx reverse proxy
Example:
```nginx
server {
  listen 80;
  server_name your-domain.tld;

  client_max_body_size 20m;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## First-run checklist
1. **Set environment variables** in `.env`:
   - `SESSION_SECRET` (change for production)
   - `BASE_URL` (public URL, used for admin token links)
   - Optional delivery: SMTP or webhook
2. Start the server.
3. **Admin token delivery**:
   - On startup the server generates a token and sends it via:
     - Email (if `ADMIN_EMAIL` + SMTP vars are set)
     - Webhook (if `ADMIN_WEBHOOK_URL` is set)
   - In development it is also logged to the terminal.
4. Photos are stored in: `${STORAGE_PATH}/photos` (default `.data/photos`).

## Storage & metadata
- Photos are stored on disk under `${STORAGE_PATH}/photos`.
- Metadata + admin token hash + content templates + slideshow settings are in `${STORAGE_PATH}/db.json`.

## Security notes
- Upload validation: type + size limit + safe filenames
- Upload rate limiting (simple in-memory limiter)
- Admin session: signed `HttpOnly` cookie (`SameSite=Strict`)
- Basic CSRF mitigation: state-changing admin endpoints require same-origin `Origin`

## Routes
- `/` photobooth
- `/gallery`
- `/slideshow`
- `/admin`
- `/impressum`
- `/datenschutz`

## API
- `POST /api/photos` (multipart upload)
- `GET /api/photos` (pagination)
- `DELETE /api/photos/:id` (admin)
- `DELETE /api/photos` (admin)
- `GET/PUT /api/content/impressum` (admin for PUT)
- `GET/PUT /api/content/datenschutz` (admin for PUT)
- `GET/PUT /api/settings/slideshow` (admin for PUT)
- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/me`
- `GET /api/admin/status`

---

**Legal:** The Impressum/Datenschutz texts are templates and not legal advice.
