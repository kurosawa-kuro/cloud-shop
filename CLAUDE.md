# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cloud-Shop is an e-commerce platform with a hybrid architecture:
- **Backend**: Node.js microservices architecture with Express.js
- **Frontend**: Next.js 15 with React 19 and TypeScript

## Commands

### Backend Development (from /backend directory)

**Development**:
```bash
# Start all services
make up

# Start infrastructure only (faster startup)
make dev-infra

# Start core services (auth, users, gateway)
make dev-core

# Start specific service in development mode
make dev-service SERVICE=auth

# Build all services
make build

# Install dependencies for all services
make install
```

**Testing**:
```bash
# Run all tests
make test

# Test specific service
make test-service SERVICE=auth

# Test with coverage
make test-coverage SERVICE=auth
```

**Database Management**:
```bash
# Run migrations for all services
make migrate-all

# Migrate specific service
make migrate-service SERVICE=auth

# Open Prisma Studio
make db-studio SERVICE=auth

# Reset all databases (WARNING: deletes data)
make db-reset
```

**Monitoring**:
```bash
# Check service status
make status

# View all logs
make logs

# View logs for specific service
make logs-service SERVICE=auth

# Check health of all services
make health

# Show port mapping
make ports
```

### Frontend Development (from /frontend directory)

```bash
# Development
npm run dev

# Build
npm run build

# Linting
npm run lint
npm run lint:fix

# Testing
npm run test:frontend    # Frontend unit tests
npm run test:backend     # Backend API tests
npm run test:e2e         # End-to-end tests
npm test                 # All tests

# Database (Prisma)
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
npm run prisma:seed
```

## Architecture

### Backend Microservices

**Service Structure**: Each service follows the pattern:
```
services/<service-name>/
├── src/
│   ├── app.js              # Express app configuration
│   ├── controllers/        # Request handlers
│   ├── services/          # Business logic
│   └── prismaClient.js    # Database client
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
├── __tests__/             # Service tests
├── server.js              # Entry point
├── openapi.yaml           # API documentation
└── package.json
```

**Core Services**:
- **Gateway** (8072): API gateway with role-based routing and rate limiting
- **Auth** (8081): Keycloak integration for authentication
- **Users** (8082): User profile and account management
- **Products** (8083): Product catalog management
- **Cart** (8084): Shopping cart operations
- **Orders** (8085): Order processing with Kafka events
- **Payments** (8086): Payment processing with Stripe integration
- **Analytics** (8087): Business analytics and reporting
- **Content** (8088): Content management
- **Message** (9010): Event processing and messaging

**Shared Library** (`/backend/shared/`):
- Common middleware (error handling, correlation ID, validation)
- Database utilities (Prisma clients for each service)
- Health check utilities
- Circuit breaker patterns
- Caching utilities
- Response helpers
- Logger configuration

### Frontend Architecture

**App Router Structure**:
```
src/app/
├── (admin-tools)/          # Admin interface
├── (auth)/                 # Authentication pages
├── (developer-tools)/      # Development utilities
├── (public)/              # Public-facing pages
├── (user)/                # User account pages
└── api/                   # API route handlers
```

**Key Features**:
- **Authentication**: AWS Cognito integration with JWT
- **State Management**: Zustand for global state
- **Database**: Prisma with PostgreSQL
- **AI Integration**: OpenAI for chatbot functionality
- **Testing**: Jest for unit tests, Playwright for E2E
- **Styling**: Tailwind CSS

### Infrastructure

**Development Environment**:
- **PostgreSQL**: Database with schema separation per environment
- **Kafka**: Message broker for event-driven architecture
- **Keycloak**: Authentication and authorization server
- **Docker**: Containerization with Docker Compose

**Environment Files**:
- `docker-compose.yml`: Default/production
- `docker-compose.dev.yml`: Development with schema separation
- `docker-compose.test.yml`: Testing environment
- `docker-compose.stg.yml`: Staging environment
- `docker-compose.prd.yml`: Production environment

## Development Workflow

1. **Backend Development**:
   - Use `make dev-infra` for infrastructure
   - Start individual services with `make dev-service SERVICE=<name>`
   - Each service has its own Prisma schema and database
   - Use shared utilities from `/backend/shared/`

2. **Frontend Development**:
   - Run `npm run dev` for hot reload
   - API routes in `/src/app/api/` proxy to backend services
   - Use TypeScript for type safety

3. **Database Changes**:
   - Modify Prisma schema in respective service
   - Run `make migrate-service SERVICE=<name>`
   - Shared database utilities handle multiple connections

4. **Testing**:
   - Each service has its own Jest configuration
   - Frontend has separate test suites for unit and E2E tests
   - Use `make test` for comprehensive testing

## Role-Based Access

The system implements three main roles:
- **customer**: Regular users (cart, orders)
- **vendor**: Sellers (orders, products)
- **admin**: Full access (analytics, all operations)

Gateway service handles role validation before routing requests.

## Docker Configuration

All services use `node:18-slim` base image for SSL/TLS compatibility. BuildKit is disabled (`DOCKER_BUILDKIT=0`) to avoid permission issues. Use the startup script `/backend/scripts/start-services.sh` for proper service orchestration.