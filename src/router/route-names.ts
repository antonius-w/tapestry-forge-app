// Route name constants for type-safe navigation
export const RouteName = {
  plans: 'plans',
  plansNew: 'plans-new',
  plansEdit: 'plans-edit',
} as const;

// Type-safe route name
export type RouteName = keyof typeof RouteName;
