# AGENTS.md — React JS + JavaScript Project

## Stack
- React 18, JavaScript (ES2022+), Vite
- Tailwind CSS for styling
- React Query (TanStack Query v5) for server state
- Zustand for global client state
- React Router v6 for routing
- Axios for HTTP requests
- Express.js for backend API (if fullstack)
- Jest + React Testing Library + Supertest for testing
- ESLint + Prettier for linting/formatting
- dotenv for environment config

---

## Code Style — Landmines (Never Do These)

### JavaScript
- NEVER use `var` — use `const` by default, `let` only when reassignment is needed
- NEVER use `==` — always use `===`
- NEVER use `eval()` — security risk, never acceptable
- NEVER mutate function arguments directly — always work on a copy
- NEVER use synchronous file/network ops in production — always async/await
- NEVER swallow errors silently — always log or rethrow with context
- NEVER use `console.log` in production — use a logger (winston, pino)
- NEVER hardcode secrets or API keys — use `.env` + `process.env`
- NEVER leave unused variables — ESLint `no-unused-vars` is enforced

### React
- NEVER use class components — functional components + hooks only
- NEVER use inline styles — Tailwind utility classes only
- NEVER mutate state directly — always use setter functions
- NEVER use `useEffect` for derived state — compute inline or use `useMemo`
- NEVER fetch data inside components directly — wrap in React Query hooks
- NEVER use default exports for components — named exports only
- NEVER use array index as `key` prop for dynamic lists
- NEVER name component files `index.jsx` — name after the component

---

## File & Folder Structure

```
project-root/
  src/
    components/         # Shared/reusable UI components
    features/           # Feature-based modules
      <feature>/
        components/     # Feature-specific components
        hooks/          # Feature-specific custom hooks
        api.js          # API call functions for this feature
    hooks/              # Shared custom hooks
    lib/
      axios.js          # Configured axios instance (import from here only)
    stores/             # Zustand stores
    pages/              # Route-level page components
    constants/          # Named constants (UPPER_SNAKE_CASE)
    utils/              # Pure utility/helper functions
    config/
      env.js            # Env var loading + validation (only place for process.env)
  tests/
    unit/               # Unit tests for utils, hooks, services
    integration/        # Integration tests for routes, API
  .env.example          # All required keys with no values (always commit this)
  index.jsx             # React entry point
  app.jsx               # Root App component + router setup
```

---

## Naming Conventions

- Component files: `PascalCase.jsx` — `UserCard.jsx`, `LoginForm.jsx`
- Hook files: `camelCase.js` prefixed with `use` — `useAuth.js`, `useUserData.js`
- Utility files: `camelCase.js` — `formatDate.js`, `parseError.js`
- Constants: `UPPER_SNAKE_CASE` — `MAX_RETRIES`, `DEFAULT_PAGE_SIZE`
- Boolean variables: `is`, `has`, `can` prefix — `isLoading`, `hasPermission`
- Event handlers: `handle` prefix — `handleSubmit`, `handleClose`
- API functions: verb + noun — `fetchUser`, `createOrder`, `deletePost`

---

## Component Rules

- One component per file
- Props object named inline via destructuring — no separate Props type
- Keep components under 150 lines — split if larger
- Co-locate tests with the component: `Button.jsx` + `Button.test.jsx`
- Always handle loading, error, and empty states when displaying async data

```jsx
// ✅ Correct component pattern
export const UserCard = ({ name, email, avatarUrl }) => {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg border">
      <img src={avatarUrl} alt={name} className="w-10 h-10 rounded-full" />
      <div>
        <p className="font-semibold">{name}</p>
        <p className="text-sm text-gray-500">{email}</p>
      </div>
    </div>
  );
};
```

---

## Hooks Rules

- Each custom hook has a single responsibility
- Return plain objects `{}` — not arrays unless order matters
- Always handle loading, error, and data states in data-fetching hooks
- Never call hooks conditionally — always at the top level of a component

```js
// ✅ Correct hook pattern
export const useUser = (userId) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    enabled: !!userId,
  });

  return { user: data, isLoading, isError };
};
```

---

## State Management

- **Server state** → React Query (`useQuery`, `useMutation`) — always
- **Global client state** → Zustand store
- **Local UI state** → `useState` inside the component
- **Derived state** → compute inline or `useMemo` — NEVER `useEffect`

```js
// ✅ Correct Zustand store
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
```

---

## API Layer Rules

- All API functions live in `src/features/<feature>/api.js`
- ALWAYS import axios from `src/lib/axios.js` — never import axios directly
- Never call APIs inside components — always wrap in a React Query hook
- Always type request and response shapes with JSDoc comments

```js
// src/lib/axios.js — configured instance
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// src/features/users/api.js
import { apiClient } from '@/lib/axios';

/**
 * @param {string} id
 * @returns {Promise<{id: string, name: string, email: string}>}
 */
export const fetchUser = async (id) => {
  const { data } = await apiClient.get(`/users/${id}`);
  return data;
};
```

---

## Environment & Config

- Load and validate all env vars in `src/config/env.js`
- Frontend env vars must be prefixed with `VITE_` for Vite
- Never access `import.meta.env` or `process.env` outside `src/config/env.js`
- Always provide `.env.example` — commit it, never commit `.env`

```js
// src/config/env.js
const required = ['VITE_API_URL'];
required.forEach((key) => {
  if (!import.meta.env[key]) throw new Error(`Missing env var: ${key}`);
});

export const env = {
  apiUrl: import.meta.env.VITE_API_URL,
};
```

---

## Constants

- All magic values in `src/constants/index.js` grouped by domain
- Never scatter magic strings/numbers across components

```js
// src/constants/index.js
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

export const AUTH = {
  TOKEN_KEY: 'auth_token',
  SESSION_EXPIRY_DAYS: 7,
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
};
```

---

## Async / Error Handling

- Always use `async/await` over `.then()/.catch()` chains
- Wrap async operations in try/catch with context in the error message
- Use `Promise.all()` for independent parallel async calls — never sequential awaits:

```js
// ✅ Correct — parallel
const [user, orders] = await Promise.all([
  fetchUser(id),
  fetchOrdersByUser(id),
]);

// ❌ Wrong — sequential (2x slower)
const user = await fetchUser(id);
const orders = await fetchOrdersByUser(id);
```

---

## Testing Rules

- Test file co-located with component: `UserCard.jsx` → `UserCard.test.jsx`
- Backend tests in `tests/unit/` or `tests/integration/`
- Use `describe` for grouping, `it` for individual test cases
- Test behavior the user sees — not implementation details
- Use `userEvent` over `fireEvent` for interactions
- Mock API calls at the React Query level, not at axios level
- Minimum: one happy-path test + one error/empty state test per component

```jsx
// ✅ Correct React test
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('calls onClick when clicked', async () => {
    const handleClick = jest.fn();
    render(<Button label="Save" onClick={handleClick} />);
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const handleClick = jest.fn();
    render(<Button label="Save" onClick={handleClick} disabled />);
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(handleClick).not.toHaveBeenCalled();
  });
});
```

---

## Security Rules

- Sanitize and validate all user inputs — never trust raw form data
- Never store JWT tokens in `localStorage` — use `httpOnly` cookies
- Use `helmet` on all Express backends
- Rate-limit auth endpoints with `express-rate-limit`
- Never log sensitive data (passwords, tokens, PII)
- Always set `rel="noopener noreferrer"` on external `<a target="_blank">` links

---

## Performance Rules

- Lazy-load all route-level page components with `React.lazy` + `Suspense`
- Memoize expensive computations with `useMemo`
- Memoize stable callbacks passed as props with `useCallback`
- Never create objects/arrays inline in JSX props — define outside or memoize
- Paginate all list endpoints and UI lists — never render unbounded arrays
- Use `React.memo` only on components with proven re-render issues — not by default

```jsx
// ✅ Correct lazy loading
const Dashboard = React.lazy(() => import('./pages/Dashboard'));

<Suspense fallback={<div className="p-4">Loading...</div>}>
  <Dashboard />
</Suspense>
```

---

## Accessibility Rules

- All interactive elements must be keyboard accessible
- Use semantic HTML — `<button>` not `<div onClick>`
- Every `<img>` needs a descriptive `alt` attribute
- Every form `<input>` must have an associated `<label>`
- Use `aria-*` attributes only when semantic HTML is not enough

---

## Git & PR Rules

- Branch naming: `feat/`, `fix/`, `chore/`, `refactor/` prefixes
- Commit format: conventional commits — `feat: add user profile page`
- No PR larger than 400 lines of diff — split into smaller PRs
- PRs must include: what changed, why, and a screenshot/recording for UI changes

---

## Agent Instructions

- When generating a new component, always create `Component.jsx` + `Component.test.jsx` together
- When adding an API call, always add the React Query hook wrapping it in the same feature's `hooks/` folder
- When adding a new route, always add it to `app.jsx` router and create the page component in `pages/`
- When adding a new env var, always update `.env.example` too
- When refactoring, show a diff — do not rewrite the entire file unless explicitly asked
- When fixing a bug, add a one-line comment above the fix explaining the root cause
- Never add a new dependency without confirming it's not already covered by the existing stack
- Never add inline comments that just restate what the code does — only comment non-obvious decisions
- Always use `Promise.all()` for parallel async calls — never sequential awaits for independent operations
- Always validate and sanitize inputs before passing to services or API calls

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
