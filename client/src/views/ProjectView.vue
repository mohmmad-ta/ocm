<script setup>
import { computed, onMounted, watchEffect } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import Footer from '../components/Footer.vue'
import Navbar from '../components/Navbar.vue'
import DataState from '../components/DataState.vue'
import { portfolioImage, usePortfolioStore } from '../stores/portfolio'

const route = useRoute()
const router = useRouter()
const { locale, t } = useI18n()
const portfolio = usePortfolioStore()
const { loading, error, projects } = storeToRefs(portfolio)
const { reload, getCompany, getProject } = portfolio
const project = computed(() => getProject(route.params.projectSlug))
const company = computed(() => project.value ? getCompany(project.value.companySlug) : null)
const nextProject = computed(() => {
  if (!project.value) return null
  const index = projects.value.findIndex((item) => item.slug === project.value.slug)
  return projects.value[(index + 1) % projects.value.length]
})
onMounted(() => portfolio.load())

function goToContact() {
  router.push({ name: 'home', hash: '#contact', query: { lang: locale.value } })
}

watchEffect(() => {
  document.title = project.value ? `${project.value.title} — OCM` : t('meta.title')
})
</script>

<template>
  <div class="min-h-screen bg-[#090909] bg-[radial-gradient(circle_at_50%_25%,rgba(244,122,75,0.12),transparent_24%)] text-cream">
    <Navbar :project-count="projects.length" @contact="goToContact" />

    <DataState v-if="loading || error" :loading="loading" :error="error" @retry="reload" />
    <main v-else-if="project" class="pb-20">
      <section class="container pt-14 sm:pt-20">
        <div class="flex flex-wrap items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          <RouterLink :to="{ name: 'home', hash: '#work', query: { lang: locale } }" class="transition hover:text-main">{{ t('projectPage.work') }}</RouterLink>
          <span>/</span>
          <RouterLink v-if="company" :to="{ name: 'company', params: { companySlug: company.slug }, query: { lang: locale } }" class="transition hover:text-main">{{ company?.name || project.client }}</RouterLink>
        </div>

        <div class="mt-12 grid gap-10 sm:grid-cols-[1.3fr_.7fr] sm:items-end">
          <div><p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-main">{{ t('projectPage.eyebrow') }} / {{ project.category }}</p><h1 class="mt-5 max-w-5xl text-[clamp(54px,8vw,132px)] font-semibold leading-[0.88] tracking-[-0.07em]">{{ project.title }}</h1></div>
          <p class="max-w-lg text-base leading-8 text-muted sm:pb-2">{{ project.description }}</p>
        </div>

        <div class="relative mt-14 aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 sm:mt-20 sm:aspect-[16/8]">
          <video v-if="project.video" :src="portfolioImage(project.video)" :poster="portfolioImage(project.cover)" controls playsinline preload="metadata" class="size-full object-contain" />
          <img v-else :src="portfolioImage(project.cover, 2200)" :alt="project.title" class="size-full object-cover brightness-75 saturate-75" />
          <span v-if="!project.video" class="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10"></span>
          <span v-if="!project.video" class="absolute bottom-6 start-6 text-4xl font-bold tracking-[-0.06em] sm:bottom-10 sm:start-10 sm:text-7xl">{{ company?.name || project.client }}</span>
        </div>
      </section>

      <section class="container grid gap-12 border-b border-line py-16 sm:grid-cols-[.7fr_1.3fr] sm:py-24">
        <div class="grid grid-cols-2 gap-5 self-start text-xs">
          <div class="border-t border-line pt-4"><span class="block text-[9px] uppercase tracking-[0.18em] text-muted">{{ t('projectPage.client') }}</span><strong class="mt-2 block">{{ company?.name || project.client }}</strong></div>
          <div class="border-t border-line pt-4"><span class="block text-[9px] uppercase tracking-[0.18em] text-muted">{{ t('projectPage.year') }}</span><strong class="mt-2 block">{{ project.year }}</strong></div>
          <div class="col-span-2 border-t border-line pt-4"><span class="block text-[9px] uppercase tracking-[0.18em] text-muted">{{ t('projectPage.scope') }}</span><strong class="mt-2 block leading-6 text-main">{{ project.services }}</strong></div>
        </div>
        <div><p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-main">{{ t('projectPage.brief') }}</p><p class="mt-4 whitespace-pre-line text-xl leading-9 text-cream/85">{{ project.description }}</p></div>
      </section>

      <section class="container grid gap-4 py-16 sm:grid-cols-2 sm:py-24">
        <div v-for="(image, index) in project.gallery" :key="image" class="overflow-hidden rounded-xl border border-white/10" :class="index === 0 ? 'sm:col-span-2 sm:aspect-[16/7]' : 'aspect-[4/5]'">
          <img :src="portfolioImage(image, index === 0 ? 1800 : 1100)" :alt="`${project.title} ${index + 1}`" class="size-full object-cover brightness-80 saturate-75" loading="lazy" />
        </div>
      </section>

      <section v-if="nextProject" class="container border-t border-line pt-16 sm:pt-24">
        <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-main">{{ t('projectPage.next') }}</p>
        <RouterLink :to="{ name: 'project', params: { projectSlug: nextProject.slug }, query: { lang: locale } }" class="group mt-5 flex items-end justify-between gap-6 border-b border-line pb-8 transition hover:border-main">
          <span class="max-w-4xl text-[clamp(42px,7vw,112px)] font-semibold leading-[0.9] tracking-[-0.065em]">{{ nextProject.title }}</span><span class="text-4xl transition group-hover:-translate-y-2 group-hover:translate-x-2">↗</span>
        </RouterLink>
      </section>
    </main>

    <main v-else class="container grid min-h-[65vh] place-items-center text-center">
      <div><p class="text-main">404</p><h1 class="mt-4 text-5xl font-semibold">{{ t('projectPage.notFound') }}</h1><RouterLink :to="{ name: 'home', query: { lang: locale } }" class="mt-8 inline-block border-b border-main pb-2 text-sm">{{ t('common.backHome') }}</RouterLink></div>
    </main>

    <Footer />
  </div>
</template>
