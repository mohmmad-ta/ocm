<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchAll, apiError } from '../../../axios/axios'
import api from '../../../axios/axios'
import { resources } from '../../admin/resources'
const { t } = useI18n()
const counts = ref({}), recent = ref([]), loading = ref(true), error = ref('')
async function load() {
  loading.value = true; error.value = ''
  try {
    const results = await Promise.all(Object.entries(resources).map(async ([key, config]) => {
      const data = key === 'hero' ? (await api.get(config.endpoint)).data.data : await fetchAll(config.endpoint)
      if (key === 'projects') recent.value = data.slice(0, 5)
      return [key, data.length]
    }))
    counts.value = Object.fromEntries(results)
  } catch (err) { error.value = apiError(err, t('admin.connectionError')) }
  finally { loading.value = false }
}
onMounted(load)
</script>
<template>
  <p class="text-xs uppercase tracking-[.22em] text-main">{{ t('admin.overview') }}</p>
  <div class="mt-3 flex flex-wrap items-end justify-between gap-5"><div><h1 class="text-4xl font-semibold tracking-tight sm:text-5xl">{{ t('admin.overviewTitle') }}</h1><p class="mt-4 text-sm leading-6 text-muted">{{ t('admin.overviewCopy') }}</p></div><RouterLink to="/admin/projects" class="rounded-xl bg-main px-5 py-3 text-sm font-semibold text-canvas">{{ t('admin.manageProjects') }} ↗</RouterLink></div>
  <p v-if="error" role="alert" class="mt-8 text-red-300">{{ error }} <button class="ms-3 underline" @click="load">{{ t('data.retry') }}</button></p>
  <div class="mt-10 grid gap-4 sm:grid-cols-2 wide:grid-cols-4"><RouterLink v-for="(config, key, index) in resources" :key="key" :to="`/admin/${key}`" class="group rounded-2xl border border-white/10 bg-[#141414] p-6 transition hover:border-main/50"><div class="flex items-center justify-between text-xs text-muted"><span>{{ t(`admin.${key}`) }}</span><span class="text-main">↗</span></div><p class="mt-7 text-5xl font-medium tracking-tight">{{ loading ? '…' : counts[key] ?? '—' }}</p><p class="mt-5 text-[10px] uppercase tracking-[.16em] text-muted">0{{ index + 1 }} / {{ t('admin.manage') }}</p></RouterLink></div>
  <section class="mt-10 overflow-hidden rounded-2xl border border-white/10"><div class="flex justify-between border-b border-white/10 p-6"><h2 class="font-semibold">{{ t('admin.recent') }}</h2><RouterLink to="/admin/projects" class="text-sm text-main">{{ t('admin.viewAll') }} ↗</RouterLink></div><p v-if="!recent.length" class="p-8 text-sm text-muted">{{ t(loading ? 'data.loading' : 'admin.empty') }}</p><div v-for="project in recent" :key="project._id" class="flex items-center justify-between gap-4 border-b border-white/5 px-6 py-5 last:border-0"><div><p>{{ project.name }}</p><p class="mt-1 text-xs text-muted">{{ project.company?.name }} · {{ project.category?.name }}</p></div><span class="rounded-full bg-white/5 px-3 py-1 text-xs" :class="project.active ? 'text-main' : 'text-muted'">{{ t(project.active ? 'admin.active' : 'admin.inactive') }}</span></div></section>
  <div class="mt-8 rounded-2xl border border-main/20 bg-main/5 p-6"><h2 class="font-semibold">{{ t('admin.startTitle') }}</h2><p class="mt-2 text-sm leading-6 text-muted">{{ t('admin.startCopy') }}</p></div>
</template>
