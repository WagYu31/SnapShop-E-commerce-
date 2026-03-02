# 🛍️ SnapShop E-commerce Platform

A **full-stack e-commerce platform** with a React Native mobile app, Golang REST API backend (modular monolith architecture), and React admin dashboard. Built with Docker, PostgreSQL, role-based access control (6-level RBAC), and ERP modules for complete business management.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [Test Accounts](#test-accounts)
- [Screenshots](#screenshots)

---

## Overview

SnapShop is a complete e-commerce solution consisting of three applications:

| Application | Description | Port |
|-------------|-------------|------|
| **snapshop** | Customer-facing mobile app (iOS/Android/Web) | 8082 |
| **snapshop-api** | REST API backend server | 8080 |
| **snapshop-admin** | Admin dashboard for business management | 5174 |

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────────────────┐
│   Mobile App    │     │  Admin Dashboard  │     │   REST API (Modular Monolith)│
│  (React Native) │────▶│  (React + Vite)   │────▶│   Go + Gin (Port: 8080)      │
│   Expo SDK 52   │     │  Port: 5174       │     │                              │
│   Port: 8082    │     │  (Docker: Nginx)  │     │  ┌─────────────────────────┐ │
└─────────────────┘     └──────────────────┘     │  │ Gateway (router.go)     │ │
                                                  │  └──────────┬──────────────┘ │
                                                  │  ┌──────────▼──────────────┐ │
                                                  │  │      10 Services        │ │
                                                  │  │ auth │ product │ order  │ │
                                                  │  │ user │ cart    │ wh     │ │
                                                  │  │ commerce │ admin │ fin  │ │
                                                  │  │ upload                  │ │
                                                  │  └──────────┬──────────────┘ │
                                                  └──────────────┼───────────────┘
                                                       ┌────────▼────────┐
                                                       │  PostgreSQL 16  │
                                                       │  (Docker Volume)│
                                                       └─────────────────┘
```

### Modular Monolith Pattern

The backend uses a **modular monolith** architecture: code is organized into 10 independent service packages, but runs as a single binary with a shared PostgreSQL database. This gives the clean separation of microservices without the operational complexity.

| Layer | Description |
|-------|-------------|
| `gateway/` | Route registration — maps HTTP routes to service handlers |
| `services/` | 10 service packages, each with its own handler |
| `models/` | Shared database models (GORM) |
| `middleware/` | JWT auth & RBAC middleware |
| `database/` | DB connection, migrations, seed data |

---

## Tech Stack

### Backend (snapshop-api)
| Technology | Purpose |
|-----------|---------|
| **Go 1.21+** | Programming language |
| **Gin** | HTTP web framework |
| **GORM** | ORM for database operations |
| **PostgreSQL 16** | Production database (Docker) |
| **JWT** | Authentication tokens |
| **bcrypt** | Password hashing |
| **Docker** | Containerized deployment |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| **Docker Compose** | Multi-container orchestration |
| **PostgreSQL 16** | Primary database |
| **Nginx** | Admin dashboard reverse proxy |
| **Docker volumes** | Data persistence |

### Mobile App (snapshop)
| Technology | Purpose |
|-----------|---------|
| **React Native** | Cross-platform mobile framework |
| **Expo SDK 52** | Development platform & build tools |
| **TypeScript** | Type-safe JavaScript |
| **Expo Router** | File-based routing |
| **AsyncStorage** | Local data persistence |

### Admin Dashboard (snapshop-admin)
| Technology | Purpose |
|-----------|---------|
| **React 19** | UI framework |
| **Vite** | Build tool & dev server |
| **React Router DOM** | Client-side routing |
| **Axios** | HTTP client |

---

## Features

### 📱 Mobile App (Customer)
- 🏠 Home screen with banner carousel & product categories
- 🔍 Product search with filters (category, price range, sort)
- 📦 Product detail with variants (color, size), reviews & ratings
- 🛒 Shopping cart with quantity management
- ❤️ Wishlist with move-to-cart functionality
- 📍 Address management (add, edit, delete, set default)
- 💳 Checkout with delivery method selection (courier/store pickup)
- 🎫 Voucher/promo code system
- 📋 Order tracking & history
- 👤 User profile management
- 🌙 Dark/Light mode toggle
- 🔐 Full authentication (register, login, forgot password)
- ⭐ Product reviews & ratings
- 🗺️ Store locator with map integration

### 🖥️ Admin Dashboard
- 📊 **Dashboard** — Real-time stats (revenue, orders, products, customers)
- 📦 **Products** — Full CRUD product management with search & pagination
- 🛒 **Orders** — Order management with status updates (pending → delivered)
- 🎫 **Vouchers** — Create & manage promotional discounts
- 🔄 **Returns** — Process return requests (approve/reject/refund)
- 🏭 **Stock Overview** — Warehouse inventory with FIFO batch tracking
- 🚨 **Low Stock Alerts** — Products below reorder point
- 📋 **Procurement** — Purchase Orders to suppliers with status management
- 📈 **Sales Report** — Revenue analytics, daily sales, top products, revenue by category
- 💰 **Profit & Loss** — Financial P&L with COGS, margins, refunds, shipping
- 👤 **Customers CRM** — Customer lifetime value, order history, reviews
- 🏪 **Store Locations** — Manage physical stores with address & hours
- 👥 **User Management** — View & manage all users
- 📝 **Audit Logs** — Track all administrative actions (SuperAdmin only)

### 🔐 Security
- JWT-based authentication with token expiry
- bcrypt password hashing
- Role-based access control (RBAC) with 5 levels
- 6-level RBAC: Customer → Seller → Warehouse → Store → Admin → SuperAdmin
- Middleware-enforced route protection
- CORS configuration

---

## Project Structure

```
SnapShop E-commerce/
├── snapshop/                    # React Native Mobile App
│   ├── app/                     # Expo Router pages
│   │   ├── (tabs)/              # Tab navigation screens
│   │   │   ├── index.tsx        # Home screen
│   │   │   ├── search.tsx       # Search & browse products
│   │   │   ├── wishlist.tsx     # Saved items
│   │   │   ├── cart.tsx         # Shopping cart
│   │   │   └── profile.tsx      # User profile & settings
│   │   ├── product/[id].tsx     # Product detail (dynamic)
│   │   ├── checkout.tsx         # Checkout flow
│   │   ├── login.tsx            # Authentication
│   │   └── ...                  # Other screens
│   ├── components/              # Reusable components
│   ├── constants/               # Theme, API config
│   └── contexts/                # Theme context provider
│
├── snapshop-api/                # Golang REST API (Modular Monolith)
│   ├── main.go                  # Entry point (simplified)
│   ├── gateway/
│   │   └── router.go            # 🆕 Centralized route registration
│   ├── services/                # 🆕 10 service-based packages
│   │   ├── auth/handler.go      # Auth Service     — Register, Login, JWT
│   │   ├── product/handler.go   # Product Service   — List, Detail, CRUD, Categories
│   │   ├── order/handler.go     # Order Service     — Checkout, Order list, Status
│   │   ├── user/handler.go      # User Service      — Profile, Password, Addresses
│   │   ├── cart/handler.go      # Cart Service      — Cart CRUD, Wishlist
│   │   ├── warehouse/handler.go # Warehouse Service — Stock, Inbound, Store transfers
│   │   ├── commerce/handler.go  # Commerce Service  — Vouchers, Reviews
│   │   ├── admin/handler.go     # Admin Service     — Dashboard, Users, SuperAdmin
│   │   ├── finance/handler.go   # Finance Service   — Reports, Procurement, P&L, CRM
│   │   └── upload/handler.go    # Upload Service    — Image upload with compression
│   ├── config/config.go         # App configuration
│   ├── database/
│   │   ├── database.go          # PostgreSQL connection & migrations
│   │   └── seed.go              # Initial seed data
│   ├── middleware/auth.go       # JWT auth & RBAC middleware
│   ├── models/models.go         # All database models (GORM)
│   ├── utils/response.go        # Standardized API responses
│   └── Dockerfile               # Multi-stage Go build
│
├── snapshop-admin/              # React Admin Dashboard
│   ├── src/
│   │   ├── App.jsx              # All pages & routing
│   │   ├── index.css            # Premium dark theme CSS
│   │   ├── main.jsx             # React entry point
│   │   └── services/api.js      # API service layer
│   ├── Dockerfile               # Multi-stage Node + Nginx build
│   └── nginx.conf               # Nginx config for SPA
│
├── docker-compose.yml           # 🆕 Full stack orchestration
├── uploads/                     # Uploaded product images (persistent)
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- **Docker** & **Docker Compose** (for backend + admin)
- **Node.js** 18+ (for mobile app development)
- **Expo CLI** (`npm install -g expo-cli`)

### 1. Clone the Repository

```bash
git clone https://github.com/WagYu31/SnapShop-E-commerce-.git
cd SnapShop-E-commerce-
```

### 2. Start Backend + Admin (Docker)

One command starts PostgreSQL, API server, and Admin dashboard:

```bash
docker-compose up --build -d
```

| Service | URL |
|---------|-----|
| API | http://localhost:8080 |
| Admin Dashboard | http://localhost:5174 |
| PostgreSQL | localhost:5432 |

Health check: `curl http://localhost:8080/health`
```json
{"architecture": "modular-monolith", "version": "2.0.0", "status": "ok"}
```

### 3. Start the Mobile App

```bash
cd snapshop
npm install
npx expo start --web --port 8082
```

For iOS simulator:
```bash
npx expo start --ios
```

For Android emulator:
```bash
npx expo start --android
```

### Without Docker (Manual)

```bash
# Backend
cd snapshop-api
go mod tidy
go run main.go

# Admin
cd snapshop-admin
npm install && npm run dev
```

---

## API Documentation

### Base URL
```
http://localhost:8080/api/v1
```

### Authentication
All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

### Endpoints Overview

#### 🔓 Public (No Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register new account |
| `POST` | `/auth/login` | Login & get JWT token |
| `GET` | `/products` | List products (filters: category, search, price, sort) |
| `GET` | `/products/:id` | Product detail with variants |
| `GET` | `/products/:id/reviews` | Product reviews |
| `GET` | `/categories` | List categories |
| `GET` | `/stores` | List store locations |

#### 🔒 Authenticated (Customer+)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/user/profile` | Get user profile |
| `PUT` | `/user/profile` | Update profile |
| `PUT` | `/user/password` | Change password |
| `GET/POST` | `/addresses` | List / Create address |
| `PUT/DELETE` | `/addresses/:id` | Update / Delete address |
| `PUT` | `/addresses/:id/default` | Set default address |
| `GET/POST` | `/cart` | List / Add to cart |
| `PUT/DELETE` | `/cart/:id` | Update / Remove cart item |
| `GET/POST` | `/wishlist` | List / Add to wishlist |
| `DELETE` | `/wishlist/:id` | Remove from wishlist |
| `POST` | `/wishlist/move-to-cart` | Move wishlist item to cart |
| `POST` | `/orders` | Checkout (create order) |
| `GET` | `/orders` | Order history |
| `GET` | `/orders/:id` | Order detail |
| `GET` | `/vouchers` | Available vouchers |
| `POST` | `/vouchers/validate` | Validate voucher code |
| `POST` | `/reviews` | Write a review |
| `POST` | `/returns` | Request a return |
| `GET` | `/dashboard` | Dashboard stats (role-filtered) |

#### 🏭 Warehouse (Level 3+)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/warehouse/stock` | Stock overview (FIFO batches) |
| `POST` | `/warehouse/stock/inbound` | Receive new stock |
| `GET` | `/warehouse/stock/alerts` | Low stock alerts |

#### 🏪 Store (Level 4+)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/store/transfer` | Transfer stock to store |
| `PUT` | `/store/transfer/:id/receive` | Confirm stock received |

#### 👨‍💼 Admin (Level 5+)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/admin/products` | Create product |
| `PUT` | `/admin/products/:id` | Update product |
| `DELETE` | `/admin/products/:id` | Delete product |
| `PUT` | `/admin/orders/:id/status` | Update order status |
| `POST` | `/admin/vouchers` | Create voucher |
| `GET` | `/admin/users` | List all users |
| `GET` | `/admin/reports/sales` | Sales report |
| `GET` | `/admin/reports/top-products` | Top selling products |
| `GET` | `/admin/reports/revenue-by-category` | Revenue by category |
| `GET/POST` | `/admin/procurement` | Purchase orders |
| `PUT` | `/admin/procurement/:id/status` | Update PO status |
| `GET` | `/admin/suppliers` | List suppliers |
| `GET` | `/admin/returns` | List returns |
| `PUT` | `/admin/returns/:id` | Update return status |
| `GET` | `/admin/finance/pnl` | Profit & Loss report |
| `GET` | `/admin/crm/customers` | Customer list with LTV |
| `GET` | `/admin/crm/customers/:id` | Customer detail |

#### 👑 SuperAdmin (Level 6)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `PUT` | `/superadmin/users/:id/role` | Change user role |
| `GET` | `/superadmin/audit-logs` | System audit logs |

---

## User Roles (6-Level RBAC)

```
Customer → Seller → Warehouse → Store → Admin → SuperAdmin
  (L1)      (L2)      (L3)       (L4)    (L5)      (L6)
```

| Role | Level | Dashboard Access | Description |
|------|-------|-----------------|-------------|
| **Customer** | 1 | Mobile App only | Browse, buy, review products |
| **Seller** | 2 | Seller dashboard | Manage own products & orders |
| **Warehouse** | 3 | Stock, Alerts, Procurement | Manage warehouse inventory & suppliers |
| **Store** | 4 | + Store Locations | Manage physical store, receive stock transfers |
| **Admin** | 5 | + All ERP modules | Full operational management |
| **SuperAdmin** | 6 | + Audit Logs, Role Mgmt | System owner, complete access |

Each higher role inherits all permissions from lower roles.

---

## Test Accounts

All accounts use password: `password123`

| Role | Name | Email |
|------|------|-------|
| Customer | John Doe | `john@snapshop.id` |
| Warehouse | Budi Warehouse | `warehouse@snapshop.id` |
| Store | Ani Store | `store@snapshop.id` |
| Admin | Sarah Admin | `admin@snapshop.id` |
| SuperAdmin | Super Admin | `superadmin@snapshop.id` |

---

## Database Models

The backend uses **15+ models** with GORM auto-migration:

| Model | Description |
|-------|-------------|
| `User` | Users with role-based access |
| `Category` | Product categories |
| `Product` | Products with SKU, pricing, stock |
| `ProductVariant` | Color/size variants per product |
| `CartItem` | Shopping cart items |
| `WishlistItem` | Wishlist items |
| `Order` | Customer orders |
| `OrderItem` | Items within an order |
| `Address` | User delivery addresses |
| `Review` | Product ratings & reviews |
| `Voucher` | Promotional discount codes |
| `StockBatch` | FIFO inventory batches |
| `StockTransfer` | Warehouse → Store transfers |
| `Store` | Physical store locations |
| `Supplier` | Product suppliers |
| `PurchaseOrder` | Orders to suppliers |
| `PurchaseOrderItem` | Items in purchase orders |
| `Return` | Product return requests |
| `AuditLog` | System activity tracking |

---

## Screenshots

### Mobile App
- Onboarding, Login, Register
- Home with categories & banners
- Product search & filters
- Product detail with variants
- Shopping cart & checkout
- Order tracking & history
- User profile with dark mode

### Admin Dashboard
- Premium dark theme
- Role-based sidebar navigation
- Real-time dashboard stats
- Product management with CRUD
- Order management with status flow
- Warehouse stock with FIFO batches
- ERP modules (Reports, Finance, CRM)

---

## License

This project is for educational and demonstration purposes.

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

Built with ❤️ by [WagYu31](https://github.com/WagYu31)
