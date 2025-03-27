# HRMS SaaS Workspace Rules

This document outlines the rules and best practices for development on the HRMS SaaS project. Following these guidelines ensures consistency, quality, and maintainability across the codebase.

## 1. Code Organization

### Project Structure
- Backend code goes in `/backend`
- Frontend code goes in `/frontend`
- Shared types and interfaces go in `/shared` (if applicable)
- Documentation goes in `/docs`

### Module Organization (Backend)
- Follow NestJS module structure
- Each business domain should have its own module
- Tenant-specific logic should be clearly separated

### Component Organization (Frontend)
- Group components by feature/domain
- Shared components go in `/components/common`
- Follow atomic design principles where possible

## 2. Coding Standards

### General
- Use consistent indentation (2 spaces)
- Maximum line length: 100 characters
- Use meaningful variable and function names
- Write self-documenting code
- Delete commented-out code; use version control instead

### TypeScript
- Enable strict mode
- Use proper typing for all variables and functions
- Avoid `any` type when possible
- Use interfaces for data structures
- Use TypeScript features (generics, unions, etc.) appropriately

### NestJS (Backend)
- Follow NestJS best practices
- Use DTOs for data validation
- Use decorators properly
- Use dependency injection
- Implement proper error handling
- Add Swagger documentation to all endpoints

### React/Next.js (Frontend)
- Use functional components with hooks
- Implement proper state management
- Use CSS modules for styling
- Write responsive designs
- Ensure accessibility compliance

## 3. Documentation

### Code Documentation
- Use JSDoc comments for functions, classes, and interfaces
- Document complex algorithms and business logic
- Add README.md for each major module

### API Documentation
- Use Swagger for API endpoints
- Document request/response schema
- Include example values
- Document authentication requirements

### Architecture Documentation
- Maintain architecture diagrams
- Document system interactions
- Keep deployment documentation updated

## 4. Testing

### Backend Testing
- Write unit tests for services
- Write integration tests for controllers
- Maintain test coverage of at least 70%
- Mock external dependencies

### Frontend Testing
- Write component tests
- Write integration tests for pages
- Test for accessibility
- Include visual regression tests

### E2E Testing
- Write end-to-end tests for critical paths
- Test tenant isolation

## 5. Version Control

### Git Workflow
- Use feature branches for all changes
- Name branches with format: `feature/description`, `bugfix/description`, etc.
- Squash commits before merging to main
- Write meaningful commit messages
- Reference issue numbers in commits

### Pull Request Process
- Create descriptive PR titles
- Fill out PR template completely
- Request reviews from appropriate team members
- Address all review comments
- Ensure all tests pass before merging

## 6. Deployment

### Environment Configuration
- Use environment variables for configuration
- Never commit sensitive information
- Document all required environment variables

### CI/CD Pipeline
- All PRs must pass CI checks
- Automated tests must pass before deployment
- Follow the staging -> production deployment flow
- Document deployment procedures

## 7. Multi-Tenant Considerations

### Data Isolation
- Always scope queries by tenant identifier
- Validate tenant access in middleware/guards
- Test tenant isolation thoroughly

### Performance
- Monitor per-tenant resource usage
- Implement rate limiting where necessary
- Consider tenant-specific caching strategies

### Security
- Implement proper authentication and authorization
- Validate input data thoroughly
- Prevent cross-tenant data access

## 8. Code Review Checklist

Before submitting code for review, ensure:
- Code follows the standards outlined in this document
- Tests are written and passing
- Documentation is updated
- No security vulnerabilities introduced
- Multi-tenant considerations are addressed
- Performance implications are considered

## 9. Working with Docker

### Container Best Practices
- Keep container images small
- Use multi-stage builds
- Document container dependencies
- Use container health checks
- Use proper logging configuration

### Local Development
- Use docker-compose for local development
- Keep development environment as close to production as possible
- Document any environment-specific configurations

## 10. Change Management

- Document significant changes in CHANGELOG.md
- Use semantic versioning for releases
- Create release notes for each version
- Communicate breaking changes clearly

## 11. Error Handling and Logging

- Implement consistent error handling strategy
- Use appropriate logging levels
- Include contextual information in logs
- Implement structured logging
- Configure error monitoring

## 12. Maintenance

- Regularly update dependencies
- Address technical debt systematically
- Refactor code when necessary
- Document technical decisions and trade-offs
- Maintain a list of known issues and limitations

---

These rules are a living document and should be updated as the project evolves. All team members are encouraged to suggest improvements.
