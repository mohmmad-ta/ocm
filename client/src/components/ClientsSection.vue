<script setup>
import { useI18n } from 'vue-i18n'
import { portfolioImage, usePortfolio } from '../composables/usePortfolio'

const { locale, t } = useI18n()
const { companies } = usePortfolio()
</script>

<template>
  <section id="clients" class="relative overflow-hidden border-b border-line py-20 sm:py-28" :aria-label="t('clients.aria')">
    <div class="pointer-events-none absolute left-1/2 top-1/2 h-80 w-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-main/[0.08] blur-[120px]"></div>
    <div class="container relative">
      <div class="mb-12 grid gap-6 sm:mb-16 sm:grid-cols-[1fr_1.25fr] sm:items-end">
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-main">{{ t('clients.eyebrow') }}</p>
          <h2 class="mt-5 text-[clamp(40px,5vw,74px)] font-semibold leading-[0.96] tracking-[-0.055em]">
            {{ t('clients.headline1') }}<br />
            <span class="font-serif font-normal italic text-main">{{ t('clients.headline2') }}</span>
          </h2>
        </div>
        <p class="max-w-xl text-sm leading-7 text-muted sm:justify-self-end sm:text-base">{{ t('clients.description') }}</p>
      </div>

      <p v-if="!companies.length" class="py-8 text-muted">{{ t('data.noCompanies') }}</p>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <RouterLink
          v-for="company in companies"
          :key="company.slug"
          :to="{ name: 'company', params: { companySlug: company.slug }, query: { lang: locale } }"
          class="group relative isolate min-h-64 overflow-hidden rounded-2xl border border-white/10 bg-[#121212] p-6 transition duration-500 hover:-translate-y-1 hover:border-main/60 sm:min-h-72"
        >
          <img :src="portfolioImage(company.image, 900)" :alt="company.name" class="absolute inset-0 -z-20 size-full object-cover opacity-25 grayscale transition duration-700 group-hover:scale-105 group-hover:opacity-40 group-hover:grayscale-0" loading="lazy" />
          <span class="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/55 to-black/10"></span>
          <span class="flex h-full flex-col justify-between">
            <span class="flex items-start justify-between">
              <span class="text-[10px] uppercase tracking-[0.18em] text-main">{{ company.industry }}</span>
              <span class="grid size-9 place-items-center rounded-full border border-white/20 transition group-hover:border-main group-hover:bg-main group-hover:text-canvas">↗</span>
            </span>
            <span>
              <span class="block text-3xl font-bold tracking-[-0.06em] sm:text-4xl">{{ company.name }}</span>
              <span class="mt-3 block text-xs text-cream/60">{{ t('clients.projectCount', { count: company.projects.length }) }}</span>
            </span>
          </span>
        </RouterLink>
      </div>
    </div>
  </section>
</template>
