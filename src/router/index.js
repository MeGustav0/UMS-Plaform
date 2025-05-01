import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store' 
import Home from '@/views/Home.vue'
import ProjectView from '@/views/ProjectView.vue'
import Login from '@/views/Login.vue'
import Profile from '../views/Profile.vue'
import NotFound from '@/views/NotFound.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/project/:id',
    component: ProjectView,
    meta: { 
      requiresAuth: true,
      requiresOrgAuth: true
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/404',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach(async (to, from, next) => {
  const isAuth = store.getters['auth/isAuthenticated'];
  const savedUser = localStorage.getItem("auth");

  // ✅ если пользователь не авторизован, но есть в localStorage
  if (!isAuth && savedUser) {
    store.commit('auth/SET_USER', JSON.parse(savedUser));
    await store.dispatch('organizations/fetchOrganizations');
    await store.dispatch('projects/fetchProjects');
  }

  // ✅ Защита доступа к проекту
  if (to.meta.requiresOrgAuth) {
    const projectId = to.params.id;
    const project = store.getters['projects/getProjectById'](projectId);

    if (!project) {
      // можно показать заглушку или просто перейти домой
      return next('/404');
    }

    const userRole = store.getters['organizations/getUserRole'](
      project.orgId,
      store.state.auth.user?.id
    );

    // if (!['admin', 'manager', 'member'].includes(userRole)) {
    //   return next('/forbidden');
    // }
  }

  next();
});

export default router