import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store' // Добавляем импорт хранилища
import Home from '@/views/Home.vue'
import ProjectView from '@/views/ProjectView.vue'
import Login from '@/views/Login.vue'
import Profile from '../views/Profile.vue'

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
      requiresOrgAuth: true // Новая метка
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
  }
]

// 2. Создаем экземпляр роутера
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  const isAuth = store.getters['auth/isAuthenticated'];
  
  // Для маршрутов с проектами
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

// 4. Экспортируем роутер
export default router