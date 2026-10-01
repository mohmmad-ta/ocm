<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  busy: { type: Boolean, default: false },
})

defineEmits(['signOut'])

const { t } = useI18n()
const sections = ['overview', 'projects', 'companies', 'categories', 'hero']
</script>

<template>
  <aside class="border-b border-white/10 bg-[#111111] p-5 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-e lg:p-7">
    <RouterLink to="/admin" class="font-display flex items-center text-4xl font-extrabold tracking-[-.07em]">
      <img src="/logo1.png" class="size-36" alt=" ">ocm
    </RouterLink>

    <p class="mt-2 text-[10px] uppercase tracking-[.22em] text-muted">{{ t('admin.studio') }}</p>

    <nav class="mt-6 flex gap-2 overflow-x-auto lg:mt-12 lg:flex-col" :aria-label="t('admin.navigation')">
      <RouterLink
        v-for="(section, index) in sections"
        :key="section"
        :to="section === 'overview' ? '/admin' : `/admin/${section}`"
        exact-active-class="!bg-main/10 !text-main"
        class="flex items-center gap-3 whitespace-nowrap rounded-xl px-4 py-3 text-sm text-muted transition hover:bg-white/5 hover:text-cream"
      >
        <span class="text-[10px] opacity-50">0{{ index + 1 }}</span>
        {{ t(`admin.${section}`) }}
      </RouterLink>
    </nav>

    <div class="mt-6 flex items-center gap-4 lg:mt-auto lg:flex-col lg:items-stretch">
      <RouterLink to="/" class="text-sm text-muted hover:text-main">{{ t('admin.viewSite') }} ↗</RouterLink>
      <button
        type="button"
        :disabled="busy"
        class="text-start text-sm text-muted hover:text-main disabled:opacity-50"
        @click="$emit('signOut')"
      >
        {{ t('admin.signOut') }}
      </button>
    </div>
  </aside>
</template>
