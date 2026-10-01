<script setup>
import { computed, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import Footer from '../components/Footer.vue'
import Navbar from '../components/Navbar.vue'
import DataState from '../components/DataState.vue'
import { portfolioImage, usePortfolio } from '../composables/usePortfolio'

const route = useRoute()
const router = useRouter()
const { locale, t } = useI18n()
const { loading, error, reload, projects, getCompany } = usePortfolio()
const company = computed(() => getCompany(route.params.companySlug))

function goToContact() {
  router.push({ name: 'home', hash: '#contact', query: { lang: locale.value } })
}

watchEffect(() => {
  document.title = company.value ? `${company.value.name} — OCM` : t('meta.title')
})
</script>

<template>
  <div class="min-h-screen bg-[#090909] bg-[radial-gradient(circle_at_50%_28%,rgba(244,122,75,0.11),transparent_25%)] text-cream">
    <Navbar :project-count="projects.length" @contact="goToContact" />

    <DataState v-if="loading || error" :loading="loading" :error="error" @retry="reload" />
    <main v-else-if="company" class="pb-20">
      <section class="container py-16 sm:py-24">
        <RouterLink :to="{ name: 'home', hash: '#clients', query: { lang: locale } }" class="inline-flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted transition hover:text-main">
          <span aria-hidden="true">←</span> {{ t('companyPage.back') }}
        </RouterLink>

        <div class="mt-12 grid gap-10 sm:grid-cols-[1.15fr_.85fr] sm:items-end">
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-main">{{ t('companyPage.eyebrow') }} / {{ company.industry }}</p>
            <h1 class="mt-5 text-[clamp(68px,12vw,190px)] font-extrabold leading-[0.82] tracking-[-0.08em]">{{ company.name }}</h1>
          </div>
          <p class="max-w-lg text-base leading-8 text-muted sm:pb-2 sm:text-lg">{{ company.description }}</p>
        </div>

        <div class="relative mt-14 aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 sm:mt-20 sm:aspect-[16/7]">
          <img :src="portfolioImage(company.image, 2000)" :alt="company.name" class="size-full object-cover brightness-75 saturate-75" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10"></div>
          <div class="absolute inset-x-0 bottom-0 grid grid-cols-3 divide-x divide-white/15 border-t border-white/15 bg-black/35 text-center backdrop-blur-md rtl:divide-x-reverse">
            <div class="px-3 py-5 sm:py-7"><span class="block text-[9px] uppercase tracking-[0.17em] text-muted">{{ t('companyPage.industry') }}</span><strong class="mt-2 block text-xs sm:text-sm">{{ company.industry }}</strong></div>
            <div class="px-3 py-5 sm:py-7"><span class="block text-[9px] uppercase tracking-[0.17em] text-muted">{{ t('companyPage.projects') }}</span><strong class="mt-2 block text-xs sm:text-sm">{{ String(company.projects.length).padStart(2, '0') }}</strong></div>
            <div class="px-3 py-5 sm:py-7"><span class="block text-[9px] uppercase tracking-[0.17em] text-muted">{{ t('companyPage.partnership') }}</span><strong class="mt-2 block text-xs sm:text-sm">{{ t('companyPage.ongoing') }}</strong></div>
          </div>
        </div>
      </section>

      <section class="container border-t border-line py-16 sm:py-24">
        <div class="mb-10 flex items-end justify-between gap-6">
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-main">{{ t('companyPage.workEyebrow') }}</p>
            <h2 class="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">{{ t('companyPage.workTitle') }}</h2>
          </div>
          <span class="text-xs text-muted">{{ company.projects.length }}</span>
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
          <RouterLink
            v-for="project in company.projects"
            :key="project.slug"
            :to="{ name: 'project', params: { projectSlug: project.slug }, query: { lang: locale } }"
            class="group"
          >
            <div class="relative aspect-[4/5] overflow-hidden rounded-xl border border-white/10 bg-[#151515] sm:aspect-[4/3]">
              <img :src="portfolioImage(project.cover, 1200)" :alt="project.title" class="size-full object-cover brightness-75 saturate-75 transition duration-700 group-hover:scale-105 group-hover:brightness-90 group-hover:saturate-100" loading="lazy" />
              <span class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></span>
              <span class="absolute end-5 top-5 grid size-11 place-items-center rounded-full border border-white/25 bg-black/20 text-lg backdrop-blur-md transition group-hover:border-main group-hover:bg-main group-hover:text-canvas">↗</span>
            </div>
            <div class="mt-5 flex items-start justify-between gap-5">
              <div><p class="text-[10px] uppercase tracking-[0.16em] text-main">{{ project.category }}</p><h3 class="mt-2 text-2xl font-semibold tracking-[-0.04em]">{{ project.title }}</h3></div>
              <span class="text-xs text-muted">{{ project.year }}</span>
            </div>
          </RouterLink>
        </div>
      </section>

      <section class="container">
        <button type="button" class="flex w-full items-center justify-between rounded-xl bg-main px-6 py-7 text-start text-xl font-semibold text-canvas transition hover:bg-[#ff946c] sm:px-10 sm:py-9 sm:text-3xl" @click="goToContact">
          {{ t('companyPage.cta') }} <span class="text-3xl">↗</span>
        </button>
      </section>
    </main>

    <main v-else class="container grid min-h-[65vh] place-items-center text-center">
      <div><p class="text-main">404</p><h1 class="mt-4 text-5xl font-semibold">{{ t('companyPage.notFound') }}</h1><RouterLink :to="{ name: 'home', query: { lang: locale } }" class="mt-8 inline-block border-b border-main pb-2 text-sm">{{ t('common.backHome') }}</RouterLink></div>
    </main>

    <Footer />
  </div>
</template>
