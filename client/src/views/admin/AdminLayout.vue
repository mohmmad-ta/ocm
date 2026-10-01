<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../stores/auth'
import AdminSidebar from '../../components/admin/AdminSidebar.vue'
import api, { apiError } from '../../../axios/axios'
const { t, locale } = useI18n()
const auth = useAuthStore()
const { admin } = storeToRefs(auth)
const router = useRouter()
const error = ref(''), busy = ref(false)
const interceptor = api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) { auth.clearSession(); router.replace('/admin/login') }
  return Promise.reject(err)
})
import { onUnmounted } from 'vue'
onUnmounted(() => api.interceptors.response.eject(interceptor))
async function signOut() {
  busy.value = true
  try { await auth.logout(); router.replace('/admin/login') }
  catch (err) { error.value = apiError(err, t('admin.connectionError')) }
  finally { busy.value = false }
}
</script>
<template>
  <div class="min-h-screen bg-[#0c0c0c] text-cream lg:grid lg:grid-cols-[240px_1fr]">
    <AdminSidebar :busy="busy" @sign-out="signOut" />
    <div class="min-w-0"><header class="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-5 sm:px-10"><p class="text-sm text-muted">{{ t('admin.workspace') }} <span class="ms-2 text-cream">/ {{ admin?.userID }}</span></p><button class="rounded-full border border-white/15 px-4 py-2 text-xs" @click="locale = locale === 'en' ? 'ar' : 'en'">{{ locale === 'en' ? 'العربية' : 'English' }}</button></header>
      <p v-if="error" role="alert" class="px-6 pt-4 text-red-300">{{ error }}</p>
      <main class="mx-auto max-w-7xl px-5 py-8 sm:p-10"><RouterView /></main>
    </div>
  </div>
</template>
