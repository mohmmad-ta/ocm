<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../../composables/useAuth'
import api, { apiError } from '../../../axios/axios'
const { t, locale } = useI18n()
const { admin, logout } = useAuth()
const router = useRouter()
const error = ref(''), busy = ref(false)
const sections = ['overview', 'projects', 'companies', 'categories', 'hero']
const interceptor = api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) { admin.value = null; router.replace('/admin/login') }
  return Promise.reject(err)
})
import { onUnmounted } from 'vue'
onUnmounted(() => api.interceptors.response.eject(interceptor))
async function signOut() {
  busy.value = true
  try { await logout(); router.replace('/admin/login') }
  catch (err) { error.value = apiError(err, t('admin.connectionError')) }
  finally { busy.value = false }
}
</script>
<template>
  <div class="min-h-screen bg-[#0c0c0c] text-cream lg:grid lg:grid-cols-[240px_1fr]">
    <aside class="border-b border-white/10 bg-[#111111] p-5 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-e lg:p-7">
      <RouterLink to="/admin" class="font-display text-4xl font-extrabold tracking-[-.07em]">ocm<span class="text-main">®</span></RouterLink>
      <p class="mt-2 text-[10px] uppercase tracking-[.22em] text-muted">{{ t('admin.studio') }}</p>
      <nav class="mt-6 flex gap-2 overflow-x-auto lg:mt-12 lg:flex-col" :aria-label="t('admin.navigation')">
        <RouterLink v-for="(section, index) in sections" :key="section" :to="section === 'overview' ? '/admin' : `/admin/${section}`" exact-active-class="!bg-main/10 !text-main" class="flex items-center gap-3 whitespace-nowrap rounded-xl px-4 py-3 text-sm text-muted transition hover:bg-white/5 hover:text-cream"><span class="text-[10px] opacity-50">0{{ index + 1 }}</span>{{ t(`admin.${section}`) }}</RouterLink>
      </nav>
      <div class="mt-6 flex items-center gap-4 lg:mt-auto lg:flex-col lg:items-stretch">
        <RouterLink to="/" class="text-sm text-muted hover:text-main">{{ t('admin.viewSite') }} ↗</RouterLink>
        <button :disabled="busy" class="text-start text-sm text-muted hover:text-main disabled:opacity-50" @click="signOut">{{ t('admin.signOut') }}</button>
      </div>
    </aside>
    <div class="min-w-0"><header class="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-5 sm:px-10"><p class="text-sm text-muted">{{ t('admin.workspace') }} <span class="ms-2 text-cream">/ {{ admin?.userID }}</span></p><button class="rounded-full border border-white/15 px-4 py-2 text-xs" @click="locale = locale === 'en' ? 'ar' : 'en'">{{ locale === 'en' ? 'العربية' : 'English' }}</button></header>
      <p v-if="error" role="alert" class="px-6 pt-4 text-red-300">{{ error }}</p>
      <main class="mx-auto max-w-7xl px-5 py-8 sm:p-10"><RouterView /></main>
    </div>
  </div>
</template>
