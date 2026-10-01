import { ref } from 'vue'
import api from '../../axios/axios'

const admin = ref(null)
let pending

export function useAuth() {
  async function checkSession() {
    if (!pending) pending = api.get('/auth/checkToken').then(({ data }) => {
      admin.value = data.data.user?.role === 'admin' ? data.data.user : null
      return !!admin.value
    }).catch(() => { admin.value = null; return false }).finally(() => { pending = null })
    return pending
  }
  async function login(credentials) {
    const { data } = await api.post('/auth/admin/login', credentials)
    admin.value = data.data.user
  }
  async function logout() {
    await api.post('/auth/logout')
    admin.value = null
  }
  return { admin, checkSession, login, logout }
}
