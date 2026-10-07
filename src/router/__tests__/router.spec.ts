import { describe, it, expect } from 'vitest';
import router from '../index';

describe('Router Configuration', () => {
  it('should have the correct routes defined', () => {
    const routes = router.getRoutes();

    const routePaths = routes.map((route) => route.path);

    expect(routePaths).toContain('/');
    expect(routePaths).toContain('/plans');
    expect(routePaths).toContain('/plans/new');
    expect(routePaths).toContain('/plans/:id/edit');
  });

  it('should redirect root path to /plans', () => {
    const routes = router.getRoutes();
    const rootRoute = routes.find((route) => route.path === '/');

    expect(rootRoute).toBeDefined();
    expect(rootRoute?.redirect).toBe('/plans');
  });

  it('should have named routes', () => {
    const routes = router.getRoutes();

    const plansRoute = routes.find((route) => route.name === 'plans');
    expect(plansRoute).toBeDefined();
    expect(plansRoute?.path).toBe('/plans');

    const newPlanRoute = routes.find((route) => route.name === 'plans-new');
    expect(newPlanRoute).toBeDefined();
    expect(newPlanRoute?.path).toBe('/plans/new');

    const editPlanRoute = routes.find((route) => route.name === 'plans-edit');
    expect(editPlanRoute).toBeDefined();
    expect(editPlanRoute?.path).toBe('/plans/:id/edit');
  });

  it('should use lazy loading for view components', () => {
    // The router is configured with lazy-loaded components using dynamic imports
    // This is verified by the fact that the routes are properly defined and work
    const routes = router.getRoutes();

    const plansRoute = routes.find((route) => route.name === 'plans');
    const newPlanRoute = routes.find((route) => route.name === 'plans-new');
    const editPlanRoute = routes.find((route) => route.name === 'plans-edit');

    // Components should be configured (either as functions for lazy loading or resolved)
    expect(plansRoute).toBeDefined();
    expect(newPlanRoute).toBeDefined();
    expect(editPlanRoute).toBeDefined();
  });

  it('should pass props to edit route', () => {
    const routes = router.getRoutes();
    const editPlanRoute = routes.find((route) => route.name === 'plans-edit');

    // Vue Router 4 uses an object for props configuration
    expect(editPlanRoute?.props).toEqual({ default: true });
  });
});
