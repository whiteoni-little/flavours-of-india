# Flavours of India — Backend Integration Prompt

You are taking over an existing React + TypeScript + Vite frontend for **Flavours of India**, a premium regional Indian snack storefront. Do not redesign the UI. Preserve the existing visual system, routes, copy hierarchy, responsive behavior, and sample-data warnings unless a functional requirement makes a small change necessary.

## Primary objective

Connect the existing frontend to a secure backend so the owner can log in to the admin workspace and create, edit, publish, archive, and delete products. The customer storefront must read the same product records from the backend. Product changes made in the admin product dashboard must appear in the customer collection and product-detail pages without editing frontend source code.

The existing frontend project is in `client/` and currently contains these customer routes:

| Route            | Purpose                    |
| ---------------- | -------------------------- |
| `/`              | Premium homepage           |
| `/collection`    | Customer product listing   |
| `/product/:slug` | Customer product detail    |
| `/cart`          | Cart and checkout scaffold |

The existing admin routes are:

| Route             | Purpose                     |
| ----------------- | --------------------------- |
| `/admin`          | Admin dashboard overview    |
| `/admin/products` | Product listing management  |
| `/admin/carts`    | Abandoned-cart CRM scaffold |
| `/admin/users`    | Users scaffold              |

## Non-negotiable rules

1. **Do not replace the existing design with a generic dashboard or generic ecommerce template.** Preserve the current premium storefront and dense admin workspace.
2. Keep the locked design tokens in the frontend. Do not introduce random colors, gradients, fonts, spacing, or component styles.
3. Never seed real products, prices, inventory, customers, or orders. Keep demo records clearly labeled as sample data. Use an empty production database or an explicit development seed command.
4. Protect all `/admin/*` routes server-side. Hiding buttons in the browser is not authentication.
5. Never put secret keys, database credentials, payment secrets, or admin service credentials in client-side code.
6. Validate and sanitize all server inputs. Use schema validation on both server and client where appropriate.
7. Delete operations must require an explicit confirmation in the UI and must be authorized server-side.
8. Images must be stored in object storage, not in the database as binary blobs and not committed into the frontend repository.
9. Preserve accessibility: keyboard navigation, visible focus states, labels, error states, mobile usability, and reduced-motion behavior.
10. Do not implement payment processing in this pass unless explicitly requested later. The checkout page can remain a scaffold.

## Recommended backend architecture

Use the project’s existing framework if one is already configured. If no backend has been selected, use:

- TypeScript backend API
- PostgreSQL-compatible relational database
- ORM with migrations
- Secure cookie-based sessions or a trusted OAuth provider
- S3-compatible object storage for product images
- Zod or equivalent request validation
- REST or typed RPC endpoints with consistent JSON errors

Do not add a second competing frontend framework. Keep the current Vite + React frontend and connect it to the new API through a small typed client layer.

## Authentication and authorization

Create an admin authentication flow with:

- Admin sign-in page at `/admin/login`
- Secure, HTTP-only, SameSite cookie session
- Password hashing with a modern password-hashing algorithm if using email/password
- Logout action
- Session expiration and server-side session invalidation
- Server middleware protecting `/admin`, `/admin/products`, `/admin/carts`, and `/admin/users`
- An `admin` role or equivalent permission check
- No public self-registration for admin accounts
- A safe first-admin setup command or environment-controlled bootstrap process
- Clear unauthorized (`401`) and forbidden (`403`) responses

Never hardcode an admin email or password in source code. Document the exact environment variables and setup command required to create the first admin account.

## Database schema

Create migrations for at least these entities.

### AdminUser

- `id`
- `email` unique
- `passwordHash` or provider subject identifier
- `name`
- `role` (`admin` initially)
- `createdAt`
- `updatedAt`
- `lastLoginAt` nullable

### Product

- `id`
- `slug` unique
- `title`
- `shortDescription`
- `longDescription` nullable
- `category`
- `priceInMinorUnits` nullable until a real price is entered
- `currency` default `INR`
- `stockStatus` (`in_stock`, `out_of_stock`, `draft`)
- `isPublished` boolean default false
- `sourcingNote` nullable
- `ingredients` nullable
- `shelfLife` nullable
- `createdAt`
- `updatedAt`
- `deletedAt` nullable for soft delete
- `createdBy`
- `updatedBy`

### ProductImage

- `id`
- `productId`
- `storageKey`
- `publicUrl` or signed URL strategy
- `altText`
- `sortOrder`
- `createdAt`

### Cart

- `id`
- `sessionId` nullable
- `userId` nullable
- `status` (`active`, `abandoned`, `contacted`, `recovered`, `converted`)
- `currency`
- `lastActivityAt`
- `createdAt`
- `updatedAt`

### CartItem

- `id`
- `cartId`
- `productId`
- `quantity`
- `unitPriceInMinorUnits` nullable until pricing exists
- `createdAt`
- `updatedAt`

### User

- `id`
- `name` nullable
- `email` unique nullable
- `phone` nullable
- `createdAt`
- `updatedAt`

### CartNote

- `id`
- `cartId`
- `authorAdminId`
- `body`
- `createdAt`

Do not expose password hashes, storage credentials, internal audit fields, or private admin metadata to the public storefront.

## API contract

Implement typed endpoints equivalent to the following. Keep the exact naming consistent throughout the project.

### Admin auth

- `POST /api/admin/auth/login`
- `POST /api/admin/auth/logout`
- `GET /api/admin/auth/session`

### Public products

- `GET /api/products?category=&search=&page=&pageSize=`
- `GET /api/products/:slug`

Only return published, non-deleted products to public routes. Do not return unpublished drafts to customers.

### Admin products

- `GET /api/admin/products?category=&stockStatus=&search=&page=&pageSize=`
- `POST /api/admin/products`
- `GET /api/admin/products/:id`
- `PATCH /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- `POST /api/admin/products/:id/images/presign`
- `POST /api/admin/products/:id/images/complete`
- `DELETE /api/admin/products/:id/images/:imageId`

`DELETE` should soft-delete by default. If permanent deletion is ever added, make it a separate strongly protected action.

### Admin dashboard and CRM

- `GET /api/admin/dashboard/summary`
- `GET /api/admin/carts?status=&sort=&page=&pageSize=`
- `POST /api/admin/carts/:id/contacted`
- `POST /api/admin/carts/:id/notes`
- `GET /api/admin/carts/:id/notes`
- `GET /api/admin/users?page=&pageSize=&search=`

Reminder-email and WhatsApp actions may remain stubs, but the server must return a clear “not configured” response rather than silently pretending that a message was sent.

## Product management behavior

Replace the current visual-only product controls with real behavior:

1. The Add Product button opens a real form or navigates to a real form view.
2. The form supports multiple image selection, previews, removal, and ordering.
3. Upload images through presigned object-storage URLs or an equivalent secure upload flow.
4. Validate title, category, descriptions, status, and price before submit.
5. A product can be saved as a draft without appearing publicly.
6. A product can be published only when the required fields are complete.
7. Edit loads the existing product and images.
8. Delete asks for confirmation, performs an authorized soft delete, and removes the product from the active admin list.
9. Search, category filtering, stock filtering, and pagination operate against the backend.
10. Show loading, success, empty, validation-error, unauthorized, and server-error states.
11. Prevent duplicate submits and stale updates.
12. Refreshing the browser must preserve saved changes because the source of truth is the backend.

## Storefront behavior

Connect `/collection` to the public products endpoint and preserve the current editorial card layout. Connect `/product/:slug` to the public product-detail endpoint. The homepage may show a small curated set of published products. If there are no published products, show an intentional empty state explaining that the collection is being prepared; do not display fake prices or fake inventory.

The cart should use a stable cart/session identifier and persist cart items through the backend or a secure server-backed session. Keep checkout as a clearly labeled scaffold unless payment and shipping requirements are supplied later.

## Environment variables

Create `.env.example` with safe placeholder names, for example:

```env
DATABASE_URL=
SESSION_SECRET=
APP_URL=http://localhost:3000
ADMIN_BOOTSTRAP_EMAIL=
ADMIN_BOOTSTRAP_PASSWORD=
OBJECT_STORAGE_ENDPOINT=
OBJECT_STORAGE_REGION=
OBJECT_STORAGE_BUCKET=
OBJECT_STORAGE_ACCESS_KEY_ID=
OBJECT_STORAGE_SECRET_ACCESS_KEY=
```

Do not commit a real `.env` file. Add any provider-specific variables only if the provider is actually used.

## Testing requirements

Add or update tests for:

- Unauthenticated admin access returns `401` or redirects safely.
- Non-admin users cannot access admin product mutations.
- Product create, update, publish, and soft-delete behavior.
- Invalid product payloads are rejected.
- Public API never returns drafts or deleted products.
- Image upload authorization and ownership.
- Product changes persist after a new request/session.
- Storefront empty state when no published products exist.
- Mobile admin product table remains usable at 375px.

Run the project’s formatter, type checker, unit tests, database migrations, and production build. Document every command.

## Deliverables

When finished, provide:

1. A working backend and database migration setup.
2. A protected admin login flow.
3. A functional product listing dashboard connected to persistent storage.
4. Working add, edit, publish, archive/delete, search, filter, and image-upload behavior.
5. Storefront pages reading published products from the same backend.
6. `.env.example` and setup documentation.
7. Seed scripts that are opt-in and clearly mark all records as sample data.
8. A concise list of changed files and commands used to run the system.

Do not claim that a feature is functional unless it has been tested end-to-end against the running backend.
