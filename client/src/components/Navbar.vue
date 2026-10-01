<script setup>
import { useI18n } from 'vue-i18n'
import { Globe, Menu, X } from '@lucide/vue'

const menuOpen = defineModel('menuOpen', { type: Boolean, default: false })
const { locale, t } = useI18n()

defineProps({
  projectCount: { type: Number, default: 0 },
})

const emit = defineEmits(['contact'])

function openContact() {
  menuOpen.value = false
  emit('contact')
}

function toggleLocale() {
  const nextLocale = locale.value === 'en' ? 'ar' : 'en'
  locale.value = nextLocale
  const url = new URL(window.location.href)
  url.searchParams.set('lang', nextLocale)
  window.history.replaceState({}, '', url)
  menuOpen.value = false
}
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-canvas/20 backdrop-blur-xl">
    <div class="mx-auto flex h-[85px] max-w-[1800px] items-center justify-between px-[5%] sm:h-[108px] sm:px-[4.2%]">
      <RouterLink dir="ltr" class="relative items-center flex pr-[18px] font-display text-[43px] font-extrabold leading-none tracking-[-4px] sm:text-[53px] sm:tracking-[-5px]" :to="{ name: 'home', query: { lang: locale } }" :aria-label="t('nav.home')">
        <img src="/logo1.png" class="w-36 h-36" alt=" ">ocm
      </RouterLink>

      <nav class="hidden gap-[37px] text-[16px] sm:flex [&_a]:transition-colors [&_a]:duration-200 [&_a:hover]:text-main [&_span]:ml-[3px] [&_span]:align-super [&_span]:text-[9px] [&_span]:text-main" :aria-label="t('nav.main')">
        <RouterLink :to="{ name: 'home', hash: '#work', query: { lang: locale } }">{{ t('nav.work') }}</RouterLink>
        <RouterLink :to="{ name: 'home', hash: '#clients', query: { lang: locale } }">{{ t('nav.clients') }}</RouterLink>
        <RouterLink :to="{ name: 'home', hash: '#about', query: { lang: locale } }">{{ t('nav.studio') }}</RouterLink>
        <RouterLink :to="{ name: 'home', hash: '#services', query: { lang: locale } }">{{ t('nav.services') }}</RouterLink>
      </nav>

      <div class="flex items-center lg:min-w-52 justify-end gap-2.5">
        <button type="button" :aria-label="t('common.language')" class="grid size-10 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-cream transition hover:border-main hover:text-main" @click="toggleLocale">
          <Globe :size="17" :stroke-width="2" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="grid size-11 place-items-center rounded border border-[#55554d] bg-transparent text-cream transition hover:border-main hover:text-main sm:hidden"
          :aria-expanded="menuOpen"
          :aria-label="menuOpen ? t('nav.closeMenu') : t('nav.openMenu')"
          aria-controls="mobile-nav"
          @click="menuOpen = !menuOpen"
        >
          <X v-if="menuOpen" :size="20" :stroke-width="2" aria-hidden="true" />
          <Menu v-else :size="20" :stroke-width="2" aria-hidden="true" />
        </button>
      </div>
    </div>
  </header>

  <nav v-if="menuOpen" id="mobile-nav" class="fixed inset-x-0 top-[85px] z-40 flex flex-col border-b border-line bg-canvas/70 px-[5%] pb-[25px] pt-2.5 shadow-2xl backdrop-blur-xl sm:hidden [&_a]:border-b [&_a]:border-line [&_a]:py-3.5 [&_a]:text-start [&_a]:text-lg [&_button]:border-b [&_button]:border-line [&_button]:bg-transparent [&_button]:py-3.5 [&_button]:text-start [&_button]:text-lg" :aria-label="t('nav.main')">
    <RouterLink :to="{ name: 'home', hash: '#work', query: { lang: locale } }" @click="menuOpen = false">{{ t('nav.work') }} ↗</RouterLink>
    <RouterLink :to="{ name: 'home', hash: '#clients', query: { lang: locale } }" @click="menuOpen = false">{{ t('nav.clients') }} ↗</RouterLink>
    <RouterLink :to="{ name: 'home', hash: '#about', query: { lang: locale } }" @click="menuOpen = false">{{ t('nav.studio') }} ↗</RouterLink>
    <RouterLink :to="{ name: 'home', hash: '#services', query: { lang: locale } }" @click="menuOpen = false">{{ t('nav.services') }} ↗</RouterLink>
    <button @click="openContact">{{ t('common.letsTalk') }} ↗</button>
  </nav>

  <div class="h-[85px] sm:h-[108px]" aria-hidden="true"></div>
</template>
