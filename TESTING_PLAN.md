# Testing Infrastructure & Unit Tests Implementation Plan

## Overview
Add comprehensive unit testing to this React Native + Supabase Edge Functions project, targeting 70-80% coverage on critical business logic. Must fix 227 TypeScript errors first before implementing tests.

## Current State
- **0 tests** exist (no testing infrastructure)
- **227 TypeScript errors** blocking development
- Pre-commit hooks configured (husky + lint-staged)
- TypeScript strict mode enabled
- Stack: React Native (Expo), Supabase Edge Functions (Deno)

---

## Phase 1: TypeScript Error Remediation (REQUIRED FIRST)

### Priority 1: Delete Unused Files (~40% of errors eliminated)
**Estimated: 5 minutes**

Delete these conflicting example directories:
- `/app-example/` - Expo example code not in use
- `/components/` - Conflicts with `src/components/`
- `/hooks/` - Conflicts with `src/hooks/`

```bash
rm -rf app-example/ components/ hooks/
npm run typecheck  # Should drop to ~140 errors
```

### Priority 2: Fix React Native Type Errors (~25% of remaining)
**Estimated: 2-3 hours**

**Root Cause:** React Native 0.79.5 type definition mismatches

**Files to fix:**
- `src/components/AddContactModal.tsx`
- `src/components/ServiceLogo.tsx`
- `src/components/OnboardingCarousel.tsx`
- `src/components/SubscriptionCancelledModal.tsx`
- `src/components/ui/input.tsx`

**Solution Pattern:**
```typescript
// Fix missing prop types
interface ExtendedTextInputProps extends TextInputProps {
  autoFocus?: boolean;
  importantForAutofill?: string;
}
```

### Priority 3: Regenerate Supabase Types (~20% of remaining)
**Estimated: 1-2 hours**

```bash
npx supabase gen types typescript --project-id <project-id> > src/types/supabase.ts
```

**Files affected:**
- `src/hooks/useAuth.ts` - `last_login_at` field
- `src/hooks/useStravaActivities.ts` - Activity schema
- `src/screens/value-preview-screen.tsx` - User properties

### Priority 4: Fix Navigation Types (~10% of remaining)
**Estimated: 1 hour**

```typescript
// Fix screen component typing in App.tsx
const GoalSetupScreen: React.FC<StackScreenProps<RootStackParamList, 'GoalSetup'>> =
  ({ navigation, route }) => {
    // ...
  };
```

### Priority 5: Fix Miscellaneous Errors (~5% remaining)
**Estimated: 1 hour**

- `src/lib/message-templates.ts:7` - Mapped type syntax
- Various implicit `any` types
- Missing analytics event types

**Target:** 0 TypeScript errors before moving to Phase 2

---

## Phase 2: Testing Infrastructure Setup

### Frontend: Jest + React Native Testing Library

**Install dependencies:**
```bash
npm install --save-dev \
  jest \
  @testing-library/react-native \
  @testing-library/jest-native \
  @testing-library/react-hooks \
  jest-expo \
  @types/jest \
  react-test-renderer
```

**Create `jest.config.js`:**
```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@supabase/.*)'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*',
  ],
  coverageThresholds: {
    global: {
      statements: 70,
      branches: 65,
      functions: 70,
      lines: 70,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

**Create `jest.setup.js`:**
```javascript
import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Supabase client
jest.mock('./src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    },
  },
}));

// Mock RevenueCat
jest.mock('react-native-purchases', () => ({
  configure: jest.fn(),
  getOfferings: jest.fn(),
  purchasePackage: jest.fn(),
}));

global.fetch = jest.fn();
```

**Add scripts to `package.json`:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:changed": "jest --onlyChanged"
  }
}
```

### Backend: Deno Test Setup

**Create `supabase/functions/deno.json`:**
```json
{
  "compilerOptions": {
    "lib": ["deno.window"],
    "strict": true
  },
  "tasks": {
    "test": "deno test --allow-all --coverage=coverage",
    "test:watch": "deno test --allow-all --watch"
  },
  "imports": {
    "std/": "https://deno.land/std@0.168.0/"
  }
}
```

**Create `supabase/functions/_shared/test-utils.ts`:**
```typescript
import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";

export function createMockSupabaseClient() {
  const mockQueryBuilder = {
    select: () => mockQueryBuilder,
    insert: () => mockQueryBuilder,
    update: () => mockQueryBuilder,
    eq: () => mockQueryBuilder,
    single: () => Promise.resolve({ data: null, error: null }),
  };

  return {
    from: () => mockQueryBuilder,
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
  };
}

export function createMockRequest(options: {
  method?: string;
  url?: string;
  body?: any;
  headers?: Record<string, string>;
}): Request {
  const { method = 'GET', url = 'http://localhost/', body, headers = {} } = options;

  return new Request(url, {
    method,
    headers: new Headers(headers),
    body: body ? JSON.stringify(body) : undefined,
  });
}

export { assertEquals, assertExists };
```

---

## Phase 3: Critical Test Implementation (Priority Order)

### Tier 1 - CRITICAL (Must test first - 90%+ coverage target)

#### 1. Validation Utilities (`src/lib/utils.ts`)
**Impact: HIGH | Complexity: LOW | Time: 2-3 hours**

Create `src/lib/__tests__/utils.test.ts`

**Key tests:**
- Email validation (valid/invalid formats, edge cases)
- Phone number validation (US, international, invalid)
- Phone number formatting (progressive as user types)
- Date validation and formatting
- Relative date display ("Today", "Yesterday")

#### 2. Goal Calculations (`src/lib/goalUtils.ts`)
**Impact: HIGH | Complexity: MEDIUM | Time: 4-6 hours**

Create `src/lib/__tests__/goalUtils.test.ts`

**Key tests:**
- Weekly progress calculation (Monday-Sunday boundaries)
- Activity type filtering (Run, VirtualRun, Ride, etc.)
- Distance conversions (meters to miles: `/1609.34`)
- Goal type handling (total_activities, total_runs, total_miles_running, etc.)
- Motivational message generation based on progress

#### 3. Message Deduplication (`src/lib/message-templates.ts`)
**Impact: HIGH | Complexity: MEDIUM | Time: 3-4 hours**

Create `src/lib/__tests__/message-templates.test.ts`

**Key tests:**
- Message hash generation consistency
- Deduplication within time window (14 days default)
- Unique message selection across 5 styles
- Template variable substitution (`{user}`, `{completed}`, `{goal}`, etc.)
- Message template integrity (all styles have all types)

#### 4. Strava Authentication (`src/services/strava-auth.ts`)
**Impact: HIGH | Complexity: HIGH | Time: 5-7 hours**

Create `src/services/__tests__/strava-auth.test.ts`

**Key tests:**
- OAuth flow (success, cancellation, error)
- Token storage/retrieval from AsyncStorage
- Token expiration detection
- Token refresh logic
- Activity fetching with date filters
- Singleton pattern enforcement

### Tier 2 - Edge Functions (75%+ coverage target)

#### 5. Goal Tracker (`supabase/functions/goal-tracker/`)
**Impact: HIGH | Complexity: HIGH | Time: 6-8 hours**

Create `supabase/functions/goal-tracker/__tests__/index.test.ts`

**Key tests:**
- Weekly period generation (Monday 00:00 to Sunday 23:59)
- Progress calculation for all goal types
- Streak calculation (consecutive days)
- Missed goal detection
- Upcoming deadline warnings (2-day threshold)

#### 6. Strava Webhook (`supabase/functions/strava-webhook/`)
**Impact: HIGH | Complexity: HIGH | Time: 5-7 hours**

Create `supabase/functions/strava-webhook/__tests__/index.test.ts`

**Key tests:**
- Webhook verification (challenge response)
- Activity create/update/delete event handling
- Token refresh when expired
- User lookup by strava_id
- Activity upsert logic

---

## Phase 4: Pre-commit Integration

**Update `.husky/pre-commit`:**
```bash
#!/bin/sh

# Frontend checks (linting on staged files)
echo "Running lint-staged..."
npx lint-staged

# Run tests on changed files only (FAST)
echo "Running tests on changed files..."
CHANGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' | grep '^src/' || true)

if [ -n "$CHANGED_FILES" ]; then
  npm run test:changed -- --bail --findRelatedTests $CHANGED_FILES
  if [ $? -ne 0 ]; then
    echo "❌ Tests failed for changed files. Commit blocked."
    exit 1
  fi
fi

# Full TypeScript type check
echo "Running TypeScript type check..."
npm run typecheck

# Backend checks (Supabase Edge Functions)
echo "Checking Supabase Edge Functions..."
if [ -d "supabase/functions" ]; then
  cd supabase/functions
  for dir in */; do
    if [ -f "$dir/index.ts" ]; then
      echo "Type checking $dir..."
      deno check "$dir/index.ts" || exit 1

      # Run tests if they exist
      if [ -d "$dir/__tests__" ]; then
        echo "Testing $dir..."
        deno test --allow-all "$dir/__tests__/" || exit 1
      fi
    fi
  done
  cd ../..
fi

echo "✅ Pre-commit checks passed!"
```

**Performance:** Tests on changed files only keeps pre-commit under 30 seconds

---

## Implementation Schedule

### Week 1: Foundation
- **Days 1-3:** Fix all TypeScript errors (Priority 1-5)
- **Day 4:** Frontend testing setup (Jest + mocks)
- **Day 5:** Backend testing setup (Deno)
- **Days 6-7:** Write Tier 1 tests (utils, goalUtils)

### Week 2: Core Logic
- **Days 8-9:** Write message-templates tests
- **Days 10-12:** Write strava-auth tests
- **Days 13-14:** Write goal-tracker Edge Function tests

### Week 3: Integration
- **Days 15-16:** Write remaining Edge Function tests
- **Day 17-18:** Write hook tests (useAuth, useStravaActivities)
- **Day 19:** Update pre-commit hook with tests
- **Day 20:** Documentation + CI setup
- **Day 21:** Coverage review + gap filling

---

## Success Metrics

**Coverage Targets:**
- ✅ Tier 1 Critical functions: >85% coverage
- ✅ Tier 2 High Priority: >70% coverage
- ✅ Overall Frontend: >70% coverage
- ✅ Overall Backend: >75% coverage

**Quality Gates:**
- ✅ 0 TypeScript errors
- ✅ All tests passing
- ✅ Pre-commit hook prevents failing commits
- ✅ Test execution < 30 seconds for changed files
- ✅ Full test suite < 2 minutes

---

## Critical Files to Create/Modify

### New Files:
1. `jest.config.js` - Jest configuration
2. `jest.setup.js` - Global test setup and mocks
3. `supabase/functions/deno.json` - Deno test config
4. `supabase/functions/_shared/test-utils.ts` - Shared test utilities
5. `src/lib/__tests__/utils.test.ts` - First test file (validation)
6. `src/lib/__tests__/goalUtils.test.ts` - Goal calculation tests
7. `src/lib/__tests__/message-templates.test.ts` - Message tests
8. `src/services/__tests__/strava-auth.test.ts` - Auth tests
9. `supabase/functions/goal-tracker/__tests__/index.test.ts` - Backend tests
10. `supabase/functions/strava-webhook/__tests__/index.test.ts` - Webhook tests

### Modified Files:
1. `.husky/pre-commit` - Add test execution
2. `package.json` - Add test scripts
3. `tsconfig.json` - Already excludes supabase (✓)

---

## Next Steps

1. Start with Phase 1: TypeScript error remediation (must complete first)
2. Set up testing infrastructure (Phase 2)
3. Write tests in priority order (Phase 3)
4. Integrate with pre-commit hooks (Phase 4)
5. Monitor coverage and iterate

**First command to run:**
```bash
rm -rf app-example/ components/ hooks/
npm run typecheck
```
