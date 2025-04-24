import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store' // Добавляем импорт хранилища
import Home from '@/views/Home.vue'
import ProjectView from '@/views/ProjectView.vue'
import Login from '@/views/Login.vue'

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
    meta: { requiresAuth: true, checkProject: true }
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

// 3. Добавляем обработчик после создания роутера
router.beforeEach((to, from, next) => {
  const isAuth = store.getters['auth/isAuthenticated']; // Используем геттер

  if (to.meta.requiresAuth && !isAuth) {
    next('/login');
  } else if (to.name === 'Login' && isAuth) {
    next('/');
  } else {
    next();
  }
});

// 4. Экспортируем роутер
export default router