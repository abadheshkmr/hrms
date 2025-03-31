# Feature Access Control Integration Guide

## Overview

This document outlines the architecture and implementation strategy for integrating feature access control with authentication and authorization in our multi-tenant HRMS SaaS platform.

## Architecture

### The Three Layers of Access Control

For a multi-tenant SaaS platform, we implement three complementary layers of access control:

1. **Identity Management (IM)**: Who is the user?
2. **Role-Based Access Control (RBAC)**: What can the user do?
3. **Feature Flags**: What features are available to the tenant?

These systems work together rather than being alternatives to each other.

### Flow Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  User Request   │────▶│  Authentication │────▶│  Authorization  │
└─────────────────┘     │  (Identity)     │     │  (RBAC)         │
                        └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │  Response       │◀────│  Feature Flags  │
                        └─────────────────┘     │  Check          │
                                                └─────────────────┘
```

### Request Flow

1. User makes a request to access a feature
2. **Identity Management** verifies who the user is and their tenant context
3. **RBAC** checks if the user has permission to access that feature
4. **Feature Flags** check if the feature is enabled for that tenant's subscription plan
5. Only if all checks pass is the feature accessible

## Implementation

### 1. User Entity

```typescript
// Base User entity with common fields
class User {
  id: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;

  // Role-based fields
  userType: UserType; // ADMIN, TENANT_ADMIN, EMPLOYEE, CLIENT
  tenantId?: string;  // Optional for platform admins

  // Profile information
  profile: UserProfile;
}

enum UserType {
  PLATFORM_ADMIN = 'platform_admin',
  TENANT_ADMIN = 'tenant_admin',
  EMPLOYEE = 'employee',
  CLIENT = 'client'
}
```

### 2. Feature Flag Entity

```typescript
interface FeatureFlag {
  id: string;
  key: string;           // Unique identifier used in code
  name: string;          // Human-readable name
  description: string;   // Detailed description
  isEnabled: boolean;    // Global on/off switch

  // Targeting rules
  tenantRules: {         // Tenant-specific rules
    includeAll: boolean;
    includeTenants: string[];
    excludeTenants: string[];
  };

  planRules: {           // Subscription plan rules
    plans: string[];     // Plan IDs that include this feature
  };

  rolloutPercentage: number;  // For gradual rollout (0-100)

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
```

### 3. Subscription Plan Entity

```typescript
interface SubscriptionPlan {
  id: string;
  code: PlanCode;         // FREE, BASIC, PRO, ENTERPRISE
  name: string;
  description: string;
  features: string[];     // Array of feature flag keys
  limits: PlanLimits;
  price: {
    monthly: number;
    annual: number;
  };
  isActive: boolean;
  metadata?: Record<string, any>;
}
```

### 4. CASL Integration with Feature Flags

```typescript
@Injectable()
export class AbilityFactory {
  constructor(
    private featureFlagsService: FeatureFlagsService,
    private subscriptionService: SubscriptionService
  ) {}

  async createForUser(user: User) {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    // 1. Basic tenant isolation (all users)
    if (user.tenantId) {
      can('read', 'all', { tenantId: user.tenantId });
    }

    // 2. Role-based permissions
    if (user.userType === UserType.PLATFORM_ADMIN) {
      can('manage', 'all');
    } else if (user.userType === UserType.TENANT_ADMIN) {
      can('manage', 'all', { tenantId: user.tenantId });
    } else if (user.userType === UserType.EMPLOYEE) {
      // Employee-specific permissions
      can('read', 'Employee', { tenantId: user.tenantId });
      can('update', 'Employee', { id: user.id, tenantId: user.tenantId });
    }

    // 3. Feature flag checks
    if (user.tenantId) {
      // Get tenant's subscription plan
      const subscription = await this.subscriptionService.getTenantSubscription(user.tenantId);

      // Get enabled features for this tenant
      const enabledFeatures = await this.featureFlagsService.getEnabledFeatures(
        user.tenantId,
        subscription.planId
      );

      // Disable access to features not in the subscription
      for (const feature of ALL_FEATURES) {
        if (!enabledFeatures.includes(feature)) {
          cannot('access', 'Feature', { key: feature });
        }
      }
    }

    return build();
  }
}
```

### 5. Feature Guard Implementation

```typescript
@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private abilityFactory: AbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const featureKey = this.reflector.get<string>(
      'feature',
      context.getHandler(),
    );

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    // Create ability for this user (includes feature checks)
    const ability = await this.abilityFactory.createForUser(user);

    // Check if user can access this feature
    return ability.can('access', 'Feature', { key: featureKey });
  }
}
```

### 6. Feature Flag Service

```typescript
@Injectable()
export class FeatureFlagsService {
  constructor(
    @InjectRepository(FeatureFlag)
    private featureFlagRepository: Repository<FeatureFlag>,
    private cacheManager: Cache
  ) {}

  async getEnabledFeatures(tenantId: string, planId: string): Promise<string[]> {
    const cacheKey = `features:${tenantId}:${planId}`;
    let features = await this.cacheManager.get<string[]>(cacheKey);

    if (!features) {
      // Get all feature flags
      const allFlags = await this.featureFlagRepository.find({
        where: { isEnabled: true }
      });

      // Filter by plan and tenant rules
      features = allFlags
        .filter(flag =>
          // Check if feature is in the plan
          flag.planRules.plans.includes(planId) &&
          // Check tenant-specific rules
          (flag.tenantRules.includeAll ||
           flag.tenantRules.includeTenants.includes(tenantId)) &&
          !flag.tenantRules.excludeTenants.includes(tenantId)
        )
        .map(flag => flag.key);

      // Cache the result
      await this.cacheManager.set(cacheKey, features, 300); // 5 minutes
    }

    return features;
  }

  async isFeatureEnabled(tenantId: string, featureKey: string): Promise<boolean> {
    const subscription = await this.subscriptionService.getTenantSubscription(tenantId);
    const enabledFeatures = await this.getEnabledFeatures(tenantId, subscription.planId);
    return enabledFeatures.includes(featureKey);
  }
}
```

### 7. Controller Usage Example

```typescript
@Controller('documents')
export class DocumentController {
  @Post('templates')
  @SetMetadata('feature', 'document_templates')
  @UseGuards(FeatureGuard)
  async createTemplate(@Body() dto: CreateTemplateDto): Promise<DocumentTemplate> {
    // Implementation
  }
}
```

## Frontend Integration

### 1. Feature Check Hook

```typescript
// React hook for checking feature access
function useFeatureAccess(featureKey: string): boolean {
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Call API to check feature access
    api.features.checkAccess(featureKey)
      .then(result => setHasAccess(result.hasAccess))
      .catch(() => setHasAccess(false));
  }, [featureKey, user]);

  return hasAccess;
}

// Usage in component
function DocumentTemplateButton() {
  const hasAccess = useFeatureAccess('document_templates');

  if (!hasAccess) return null;

  return (
    <Button onClick={handleCreateTemplate}>
      Create Template
    </Button>
  );
}
```

### 2. Feature Config API

```typescript
@Controller('features')
export class FeatureFlagsController {
  @Get('client-config')
  async getClientConfig(@Req() request): Promise<ClientFeatureConfig> {
    const tenantId = request.tenant.id;
    return this.featureFlagsService.getClientConfig(tenantId);
  }

  @Get('check/:featureKey')
  async checkFeatureAccess(
    @Param('featureKey') featureKey: string,
    @Req() request
  ): Promise<{ hasAccess: boolean }> {
    const tenantId = request.tenant.id;
    const hasAccess = await this.featureFlagsService.isFeatureEnabled(
      tenantId,
      featureKey
    );

    return { hasAccess };
  }
}
```

## Implementation Timeline

1. **Week 1**: Identity Management (user authentication)
   - Implement user entity
   - Set up JWT authentication
   - Create login/register endpoints

2. **Week 2**: Basic RBAC with CASL
   - Implement CASL integration
   - Create role-based guards
   - Set up permission system

3. **Week 3**: Feature Flags Service
   - Implement feature flag entity
   - Create feature flag service
   - Set up admin UI for managing flags

4. **Week 4**: Integration of RBAC with Feature Flags
   - Extend CASL with feature flag checks
   - Create feature guard
   - Implement frontend integration

## Best Practices

1. **Cache Feature Access**: Cache feature access decisions to improve performance
2. **Default to Deny**: Always default to denying access unless explicitly granted
3. **Audit Logging**: Log all feature access attempts for security and debugging
4. **Graceful Degradation**: Handle feature unavailability gracefully in the UI
5. **Testing**: Create comprehensive tests for feature access logic

## Conclusion

This integrated approach provides a clean, maintainable system that handles both user permissions (RBAC) and subscription-based feature access (Feature Flags) in a unified way. By leveraging CASL's flexible permission system, we can implement complex access control rules while keeping the codebase maintainable.
