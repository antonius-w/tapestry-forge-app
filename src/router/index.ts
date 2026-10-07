import { createRouter, createWebHistory } from 'vue-router';
import { RouteName } from './route-names';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/plans',
    },
    {
      path: '/plans',
      name: RouteName.plans,
      component: (): Promise<typeof import('@/views/plans/PlansList.vue')> =>
        import('@/views/plans/PlansList.vue'),
    },
    {
      path: '/plans/new',
      name: RouteName.plansNew,
      component: (): Promise<typeof import('@/views/plans/PlanForm.vue')> =>
        import('@/views/plans/PlanForm.vue'),
    },
    {
      path: '/plans/:id/edit',
      name: RouteName.plansEdit,
      component: (): Promise<typeof import('@/views/plans/PlanForm.vue')> =>
        import('@/views/plans/PlanForm.vue'),
      props: true,
    },
  ],
});

export { RouteName };
export default router;
