# Prime Store (PostgreSQL + Express + React + Node)

Production-style e-commerce platform implementing your requested architecture, adapted to PostgreSQL (instead of MongoDB).

## Implemented Architecture

- Public storefront: home, listing, product details, search/filter/sort, guest cart, live cart count.
- Guest checkout: no login required, collects full name/email/phone/address/payment method, stores order with `isGuest: true` and email reference.
- Authenticated checkout: links order to `userId` with `isGuest: false`.
- JWT auth with httpOnly cookie sessions.
- Password hashing with bcrypt.
- Role-based admin routes (`user`, `admin`).
- Guest cart in localStorage, user cart in DB (`Cart`, `CartItem`) with merge on login.
- Wishlist, profile update, saved shipping addresses.
- Order status workflow: pending, paid, shipped, delivered, cancelled.
- Stock validation + stock decrement on purchase.
- Action logs and admin reports/log pages.
- Security middleware: Helmet, CORS (credentials), rate limiting, Joi validation.
- Stripe payment intent endpoint.
- Backend tests for health, auth middleware behavior, protected routes.

## Backend Structure

- `backend/src/controllers`
- `backend/src/routes`
- `backend/src/middleware`
- `backend/src/utils`
- `backend/src/config`
- `backend/src/server.js`

## Frontend Structure

- `frontend/src/components`
- `frontend/src/pages`
- `frontend/src/features` (Redux)
- `frontend/src/api/client.js`
- `frontend/src/components/ProtectedRoute.jsx`

## Database Models (Prisma/PostgreSQL)

- `User`
- `Product`
- `Order`
- `Review`
- `Cart`
- plus: `OrderItem`, `CartItem`, `Wishlist`, `ActionLog`

## Setup (Local)

1. Install dependencies:

```bash
cd mern-ecommerce/backend && npm install
cd ../frontend && npm install
```

2. Create env files:

```bash
cd ../backend
cp .env.example .env
cd ../frontend
cp .env.example .env
```

3. Ensure PostgreSQL DB exists:

```sql
CREATE DATABASE mern_ecommerce;
```

4. Apply schema + seed data:

```bash
cd ../backend
npm run prisma:generate
npm run prisma:push
npm run seed
```

5. Run backend:

```bash
npm run dev
```

6. Run frontend:

```bash
cd ../frontend
npm run dev
```

7. Open app:

- `http://localhost:5173`
- `http://localhost:5000/api/health`

## Demo Accounts

- Admin: `admin@mernstore.dev` / `Admin123!`
- User: `user@mernstore.dev` / `User123!`

## Tests

```bash
cd backend
npm test
```

## Deployment

- Frontend: Vercel (`frontend/`)
- Backend: Render/Railway (`backend/`)
- Set env vars from `backend/.env.example`
- Use managed PostgreSQL connection string for `DATABASE_URL`

## Notes

- Requirement requested MERN; implementation uses PostgreSQL by your instruction.
- For full production payments, add Stripe webhook verification for payment finalization.
