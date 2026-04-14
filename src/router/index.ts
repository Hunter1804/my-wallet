import { createRouter, createWebHistory } from 'vue-router'
import { watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { title: 'Đăng nhập', public: true, shell: false },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { title: 'Đăng ký', public: true, shell: false },
    },
    {
      path: '/lock',
      name: 'lock',
      component: () => import('@/views/PinView.vue'),
      meta: { title: 'Khóa', public: true, shell: false },
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { title: 'Tổng quan', tab: 'home' },
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('@/views/HistoryView.vue'),
      meta: { title: 'Lịch sử', tab: 'history' },
    },
    {
      path: '/add',
      name: 'add',
      component: () => import('@/views/AddExpenseView.vue'),
      meta: { title: 'Thêm chi tiêu', tab: 'add' },
    },
    {
      path: '/members',
      name: 'members',
      component: () => import('@/views/MembersView.vue'),
      meta: { title: 'Thành viên', tab: 'members' },
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.isAuthReady) {
    await new Promise<void>((resolve) => {
      const stop = watch(() => auth.isAuthReady, (ready) => {
        if (ready) {
          stop()
          resolve()
        }
      }, { immediate: true })
    })
  }

  if (to.meta.public) return true
  if (!auth.isLoggedIn) return { name: 'login' }
  if (!auth.familyUnlocked) return { name: 'lock' }
  return true
})

export default router
