import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store' // Добавляем импорт хранилища
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

router.beforeEach((to, from, next) => {
  const isAuth = store.getters['auth/isAuthenticated'];

  if (to.meta.requiresOrgAuth) {
    const projectId = to.params.id;
    const project = store.getters['projects/getProjectById'](projectId);
    
    if (!project) {
      next('/404');
      return;
    }
    
    const userRole = store.getters['organizations/getUserRole'](
      project.orgId,
      store.state.auth.user.id
    );
    
    if (!['admin', 'manager'].includes(userRole)) {
      next('/forbidden');
      return;
    }
  }
  
  next();
});

export default router