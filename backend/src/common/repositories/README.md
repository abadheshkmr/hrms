# Repository Patterns for Multi-Tenant Architecture

This directory contains the implementation of repository patterns that support the multi-tenant architecture of the HRMS SaaS application.

## Overview

The repository patterns provide:

1. **Data Isolation** - Ensures data from different tenants is properly isolated
2. **Type Safety** - Leverages TypeScript generics for type-safe repository operations
3. **Consistency** - Standard CRUD operations across all entities
4. **Transaction Support** - Utilities for executing operations within transactions

## Available Repositories

### GenericRepository

The `GenericRepository` provides basic CRUD operations for any entity extending `BaseEntity`:

```typescript
// Example usage
const usersRepository = repositoryFactory.createGenericRepository(User);
const users = await usersRepository.find({ where: { isActive: true } });
```

### TenantAwareRepository

The `TenantAwareRepository` extends the generic repository and automatically filters by the current tenant:

```typescript
// Example usage
const employeesRepository = repositoryFactory.createTenantAwareRepository(Employee);
// No need to filter by tenant - it's automatic!
const employees = await employeesRepository.find({ where: { department: 'Engineering' } });
```

## Using the Repository Factory

The `RepositoryFactory` service makes it easy to create repositories for your entities:

```typescript
@Injectable()
export class EmployeeService {
  private employeeRepository: TenantAwareRepository<Employee>;
  
  constructor(private repositoryFactory: RepositoryFactory) {
    this.employeeRepository = repositoryFactory.createTenantAwareRepository(Employee);
  }
  
  // Now use the repository in your service methods
}
```

## Filtering and Pagination

Use the `FilterQuery` interface for standardized filtering and pagination:

```typescript
// Define your entity-specific filter
export interface EmployeeFilter extends FilterQuery<Employee> {
  department?: string;
  hireDate?: Date;
}

// Use it in your service
async findAll(filter: EmployeeFilter = {}): Promise<PaginatedResult<Employee>> {
  const { skip, take } = getPaginationParams(filter);
  
  // ... build query with filter parameters
  
  return {
    items: employees,
    meta: {
      page: filter.page || 0,
      limit: take,
      totalCount,
    },
  };
}
```

## Using with Transactions

Both repositories support transactions for atomicity:

```typescript
await employeeRepository.executeTransaction(async (manager) => {
  // Create employee
  const employee = await employeeRepository.create(employeeData);
  
  // Update related records
  await departmentRepository.update(departmentId, { employeeCount: increment(1) });
  
  return employee;
});
```

## Best Practices

1. **Always use repository factory** instead of creating repositories directly
2. **Prefer TenantAwareRepository** for tenant-specific entities 
3. **Use the FilterQuery interface** for consistent filtering across the app
4. **Wrap related operations in transactions** when they need to be atomic
5. **Let the repositories handle tenant filtering** - never filter by tenant manually

## Testing

See example tests in:
- `generic.repository.spec.ts`
- `tenant-aware.repository.spec.ts`
- `repository.factory.spec.ts`
