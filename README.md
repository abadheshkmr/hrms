# HRMS SaaS - Multi-Tenant Application

This project is a multi-tenant HRMS (Human Resource Management System) SaaS application built with NestJS (backend), NextJS (frontend), PostgreSQL, Nginx (API Gateway), and RabbitMQ for event-driven architecture.

## Development

Please follow our [Workspace Rules](./WORKSPACE_RULES.md) when contributing to this project.

## Architecture Overview

The application follows a multi-tenant architecture where multiple organizations (tenants) can use the same instance of the application while keeping their data isolated.

### Key Components

1. **NestJS Backend API**: Core service handling business logic and data access
2. **NextJS Frontend**: User interface for the application
3. **PostgreSQL Database**: Shared database with tenant identifiers
4. **Nginx API Gateway**: Manages routing, security, and load balancing
5. **RabbitMQ**: Facilitates event-driven and pub/sub communication

### Multi-Tenancy Strategy

This application implements a shared database multi-tenancy approach where all tenants' data is stored in the same database but identified by a tenant identifier. This strategy offers:

- Cost-effective resource sharing
- Simplified maintenance
- Consistent application experience across tenants

## Setup Instructions

### Prerequisites

- Docker and Docker Compose
- Node.js (v18+)
- npm (v8+)

### Getting Started

1. Clone the repository:

```bash
git clone [repository URL]
cd Hrms-SaaS
```

2. Start the Docker environment:

```bash
docker-compose up -d
```

This will start all services: PostgreSQL, NestJS backend, NextJS frontend, Nginx, and RabbitMQ.

### Access the Application

- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- API Gateway: http://localhost:80
- RabbitMQ Management UI: http://localhost:15672 (username: guest, password: guest)

## Development Workflow

### Backend (NestJS)

The backend code is in the `backend` directory.

```bash
cd backend

# Install dependencies
npm install

# Start development server
npm run start:dev
```

### Frontend (NextJS)

The frontend code is in the `frontend` directory.

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Multi-Tenancy Implementation

The application detects the current tenant through:

1. Subdomain: tenant1.example.com
2. Custom header: x-tenant-id
3. Path parameter: /api/tenants/{tenantId}/resources

The TenantMiddleware in the backend handles tenant identification and sets the appropriate tenant context for each request.

## Event-Driven Architecture

The application uses RabbitMQ for inter-service communication through events. Key events include:

- tenant.created
- tenant.updated
- tenant.deleted

These events trigger various actions across the system, such as tenant provisioning, resource allocation, and cleanup.

## Directory Structure

```
/project-root
  /backend          # NestJS application
  /frontend         # NextJS application
  /config           # Configuration files
    /nginx          # Nginx configuration
  docker-compose.yml
  README.md
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

[Your license information]
