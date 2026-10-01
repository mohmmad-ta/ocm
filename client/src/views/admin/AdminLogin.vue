<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../stores/auth'
import { apiError } from '../../../axios/axios'
const { t, locale } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const userID = ref(''), password = ref(''), error = ref(''), busy = ref(false)
async function submit() {
  busy.value = true; error.value = ''
  try { await auth.login({ userID: userID.value, password: password.value }); await router.replace('/admin') }
  catch (err) { error.value = apiError(err, t('admin.connectionError')) }
  finally { busy.value = false }
}
</script>
<template>
  <main class="grid min-h-screen bg-canvas bg-[radial-gradient(ellipse_at_top,rgba(244,122,75,0.13),transparent_60%)] px-5 py-12 text-cream sm:grid-cols-2 sm:items-center sm:gap-16 sm:px-[8%]">
    <div class="mb-10 sm:mb-0"><RouterLink to="/" class="font-display text-6xl font-extrabold tracking-[-.08em]">ocm<span class="text-main">®</span></RouterLink><p class="mt-10 text-xs uppercase tracking-[.25em] text-main">{{ t('admin.studio') }}</p><h1 class="mt-5 max-w-lg text-5xl font-semibold leading-tight tracking-tight">{{ t('admin.loginTitle') }}</h1><p class="mt-5 max-w-md leading-7 text-muted">{{ t('admin.loginCopy') }}</p></div>
    <form class="w-full max-w-lg rounded-3xl border border-white/10 bg-[#131313] p-7 shadow-2xl sm:p-10" @submit.prevent="submit">
      <div class="flex items-center justify-between"><h2 class="text-2xl font-semibold">{{ t('admin.signIn') }}</h2><button type="button" class="text-sm text-main" @click="locale = locale === 'en' ? 'ar' : 'en'">{{ locale === 'en' ? 'العربية' : 'English' }}</button></div>
      <label class="mt-8 block text-sm">{{ t('admin.userID') }}<input v-model="userID" name="username" autocomplete="username" required class="mt-2 block w-full rounded-xl border border-white/15 bg-canvas p-3 outline-none focus:border-main" /></label>
      <label class="mt-5 block text-sm">{{ t('admin.password') }}<input v-model="password" name="password" type="password" autocomplete="current-password" required class="mt-2 block w-full rounded-xl border border-white/15 bg-canvas p-3 outline-none focus:border-main" /></label>
      <p v-if="error" role="alert" class="mt-5 text-sm text-red-300">{{ error }}</p>
      <button :disabled="busy" class="mt-8 w-full rounded-xl bg-main p-3.5 font-semibold text-canvas disabled:opacity-50">{{ t(busy ? 'admin.signingIn' : 'admin.signIn') }} <span aria-hidden="true">↗</span></button>
      <RouterLink to="/" class="mt-6 block text-center text-sm text-muted hover:text-main">{{ t('admin.viewSite') }}</RouterLink>
    </form>
  </main>
</template>
