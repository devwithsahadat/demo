# AI Content Transformer (Full Stack)

A production-ready starter platform for transforming **user-owned or licensed** content with AI-style rewriting workflows.

## Features
- JWT auth (register/login)
- Rewrite API with multiple modes (standard/creative/SEO/summary/expand)
- English, Bangla, Hindi options
- Keyword-preservation option
- File upload support (TXT, DOCX, PDF)
- User dashboard history
- Admin dashboard stats + user banning
- REST API with rate limiting and input validation
- MySQL schema included
- Optional PHP endpoint for cPanel hosting

> Legal notice: this app does not guarantee legal outcomes. Users must only process content they own or are permitted to transform.

## Project Structure
- `frontend/` static client UI (Tailwind + JS)
- `backend/` Node.js + Express API
- `admin/` admin pages
- `database/database.sql` MySQL schema

## Installation (Local VPS / VM)
1. Install Node.js 18+, MySQL 8+.
2. Import DB:
   ```bash
   mysql -u root -p < database/database.sql
   ```
3. Configure environment:
   ```bash
   cp backend/.env.example backend/.env
   ```
4. Install dependencies:
   ```bash
   cd backend && npm install
   ```
5. Run server:
   ```bash
   npm start
   ```
6. Open:
   - Frontend: `http://localhost:5000/frontend/index.html`
   - Rewrite UI: `http://localhost:5000/frontend/rewrite.html`
   - Admin: `http://localhost:5000/admin/admin-login.html`

## Deployment Guide

### VPS (Nginx + PM2)
- Set env vars in `backend/.env`.
- Run `pm2 start server.js --name ai-transformer`.
- Reverse proxy 80/443 to `localhost:5000`.

### cPanel Shared Hosting
- Use `backend/api.php` for lightweight rewriting endpoint.
- Upload `frontend/` and `admin/` to public web root.
- Configure MySQL credentials in PHP as needed.

### Vercel
- Deploy frontend (`frontend/`) as static site.
- Deploy backend as separate Node service (e.g., Railway/Render) and update `API_BASE` in `frontend/script.js`.

### Netlify
- Deploy static frontend/admin folders.
- Point API calls to hosted backend URL.

## Security Notes
- JWT auth for protected endpoints
- Rate limiting via `express-rate-limit`
- Helmet headers + CORS
- Joi input validation
- Parameterized MySQL queries to reduce SQL injection risk

