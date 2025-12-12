# E-Commerce API Template  
**ASP.NET Core 9 Web API + React.js Frontend (Full-Stack Prototype)**

[![.NET 8](https://img.shields.io/badge/.NET-8.0-blue.svg)](https://dotnet.microsoft.com/download/dotnet/8.0)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)


A complete, clean, and well-structured **e-commerce backend + frontend template** built with modern practices.
Includes full user authentication, basket, checkout flow with **simulated payment processing**, order management, and admin panel capabilities. 
**No real payments are processed** – uses a local webhook simulation for full end-to-end testing.

---

### Features

#### Backend (ASP.NET Core 8 Web API)
- Clean layered architecture (Controllers → Services → Data)
- JWT Authentication with Bearer tokens (HS512)
- Role-based authorization (`Member`, `Admin`)
- Full **RequestHelpers** pattern for reusable HTTP logic
- DTOs + AutoMapper mappings
- Dependency Injection with extension methods
- Entity Framework Core + **SQLite** 
- Swagger UI with full Bearer token support
- CORS enabled for React frontend
- Stock management (quantity decreases on successful order)
- Simulated Stripe-like payment flow:
  - Create PaymentIntent
  - Local webhook endpoint to confirm payment
- Admin endpoints for product management

#### Frontend (React.js)
- Vite-powered React 18 
- Axios with automatic JWT token attachment
- Protected routes & role-based access
- Clean component structure ready for scaling
- Full integration with backend API

---

### Tech Stack

| Layer           | Technology                              |
|-----------------|-----------------------------------------|
| Backend         | ASP.NET Core 8 Web API                  |
| Database        | SQLite (`store.db`)                     |
| ORM             | Entity Framework Core                   |
| Authentication  | JWT + ASP.NET Core Identity (custom)    |
| API Docs        | Swashbuckle / Swagger UI                |
| Frontend        | React + Vite                            |
| HTTP Client     | Axios + interceptors                    |

---


### Backend Structure:
```
backend/
├── Controllers/         # API endpoints
├── DTOs/                # Request/Response models
├── Entities/            # EF Core models
├── Services/            # Business logic
├── Data/                # AppDbContext, migrations
├── RequestHelpers/      # Custom reusable API helpers (core feature!)
├── Extensions/          # IServiceCollection, IApplicationBuilder extensions
├── Helpers/             # Mapping profiles, utilities
└── Middleware/
```

### Security:
Passwords hashed using ASP.NET Core Identity defaults
JWT tokens include role claims (Member / Admin)
Token expiration: 24 hours
[Authorize] + [Authorize(Roles = "Admin")] properly enforced
CORS restricted to frontend origin

### Testing Full Flow in Swagger (Recommended)

1) Login: POST /api/Account/login

```json
{ "username": "wizard", "password": "Pa$$w0rd" }
```

2) Authorize
Copy the token → Click Authorize → Paste: Bearer <your-jwt-token>

3) Basket
GET /api/Basket → See current basket
POST /api/Basket → Add item (send product ID)
DELETE /api/Basket → Clear basket

4) Create Payment Intent
POST /api/Payments → Returns paymentIntent and clientSecret
Create OrderPOST /api/Orders → Creates order from basket
Simulate Payment Success (Webhook)
POST /api/Payments/webhook

```json
{
"id": "pi_xxx_from_step_4",
  "clientSecret": "pi_xxx_secret_xxx_from_step_4"
}
```
