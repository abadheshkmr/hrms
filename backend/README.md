# Backend Structure

This backend follows a domain-driven structure designed for scalability and maintainability.

## Directory Structure

```
backend/
├── src/
│   ├── app.module.ts         # Main application module
│   ├── main.ts               # Application entry point
│   ├── common/               # Shared code across all domains
│   │   ├── constants/        # Application constants
│   │   ├── decorators/       # Custom decorators
│   │   ├── dto/              # Shared DTOs
│   │   ├── entities/         # Base entities
│   │   ├── exceptions/       # Custom exceptions
│   │   ├── guards/           # Authentication/authorization guards
│   │   ├── interceptors/     # Custom interceptors
│   │   ├── interfaces/       # TypeScript interfaces
│   │   ├── middleware/       # Custom middleware
│   │   ├── pipes/            # Custom validation pipes
│   │   └── utils/            # Utility functions
│   ├── core/                 # Core infrastructure
│   │   ├── config/           # Application configuration
│   │   ├── database/         # Database connection and configuration
│   │   ├── events/           # Event handling (RabbitMQ)
│   │   ├── logger/           # Logging functionality
│   │   └── security/         # Security-related functionality
│   ├── modules/              # Business domains
│   │   ├── tenants/          # Multi-tenancy
│   │   │   ├── dto/          # Tenant-specific DTOs
│   │   │   ├── entities/     # Tenant entity
│   │   │   ├── interfaces/   # Tenant-specific interfaces
│   │   │   ├── tenant.middleware.ts
│   │   │   ├── tenants.controller.ts
│   │   │   ├── tenants.module.ts
│   │   │   └── tenants.service.ts
│   │   └── [other domains]/  # Other business domains
│   └── shared/               # Shared business logic
│       ├── services/         # Shared services
│       └── modules/          # Shared modules
└── test/                     # Tests
```

## Key Components

### Common

The `common` directory contains code that is shared across the entire application. This includes base entities, utility functions, and other reusable components.

### Core

The `core` directory contains infrastructure-related code that is essential for the application to function but is not directly related to business logic.

### Modules

The `modules` directory contains business domains, each with its own set of controllers, services, entities, and DTOs. Each module represents a distinct area of functionality in the application.

### Shared

The `shared` directory contains business logic that is shared between multiple modules.

## Multi-Tenancy

This application implements a multi-tenant architecture where multiple organizations (tenants) can use the same instance of the application while keeping their data isolated.

### Tenant Identification

Tenants are identified through:

1. Subdomain: tenant1.example.com
2. Custom header: x-tenant-id
3. Path parameter: /api/tenants/{tenantId}/resources

### Tenant Context

The `TenantContextService` provides access to the current tenant's ID throughout the application.

## Adding a New Module

To add a new module:

1. Create a directory under `modules/`
2. Create the necessary files (controller, service, entities, DTOs)
3. Import the module in `app.module.ts`

## Tenant Isolation

All tenant-specific entities should extend `TenantBaseEntity` from `common/entities/tenant-base.entity.ts`.
