<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { portfolioImage } from '../stores/portfolio'

const { locale, t } = useI18n()

const props = defineProps({
  projects: { type: Array, required: true },
  filters: { type: Array, required: true },
})

const emit = defineEmits(['select', 'contact'])
const activeFilter = defineModel('activeFilter', { type: String, default: 'all' })
const carousel = ref(null)

const visibleProjects = computed(() => {
  if (activeFilter.value === 'all') return props.projects
  return props.projects.filter((project) => project.categoryId === activeFilter.value)
})

const capabilities = computed(() => [
  { number: '01', title: t('capabilities.idea.title'), copy: t('capabilities.idea.copy') },
  { number: '02', title: t('capabilities.studio.title'), copy: t('capabilities.studio.copy') },
  { number: '03', title: t('capabilities.screens.title'), copy: t('capabilities.screens.copy') },
])

const imageUrl = portfolioImage

function cardPosition(index, count) {
  if (count > 3) return 'sm:[transform:none]'
  if (count === 1) return 'sm:z-20 sm:scale-105'
  if (count === 2) {
    return index === 0
      ? 'sm:[transform:perspective(900px)_rotateY(8deg)_rotateZ(-2deg)]'
      : 'sm:[transform:perspective(900px)_rotateY(-8deg)_rotateZ(2deg)]'
  }
  if (index === 0) return 'sm:origin-right sm:[transform:perspective(900px)_rotateY(15deg)_rotateZ(-4deg)_translateX(28px)_scale(.92)]'
  if (index === count - 1) return 'sm:origin-left sm:[transform:perspective(900px)_rotateY(-15deg)_rotateZ(4deg)_translateX(-28px)_scale(.92)]'
  return 'sm:z-20 sm:[transform:translateY(-12px)_scale(1.06)]'
}

function scrollProjects(direction) {
  if (!carousel.value) return
  const firstCard = carousel.value.querySelector('article')
  const gap = 16
  const step = (firstCard?.getBoundingClientRect().width || carousel.value.clientWidth * 0.72) + gap
  const directionMultiplier = document.documentElement.dir === 'rtl' ? -1 : 1
  carousel.value.scrollBy({ left: step * direction * directionMultiplier, behavior: 'smooth' })
}

watch(activeFilter, async () => {
  await nextTick()
  carousel.value?.scrollTo({ left: 0, behavior: 'smooth' })
})
</script>

<template>
  <section id="work" class="relative overflow-hidden border-b border-line bg-[#090909] py-24 text-cream sm:py-32">
    <div class="pointer-events-none absolute left-1/2 top-[45%] h-[28rem] w-[52rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-main/15 blur-[130px]"></div>

    <div class="relative mx-auto max-w-6xl px-[5.5%]">
      <div class="mx-auto max-w-3xl text-center">
        <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-main">{{ t('work.eyebrow') }}</p>
        <h2 class="mt-5 text-[clamp(42px,6.7vw,88px)] font-semibold leading-[1.0] tracking-[-0.060em] text-cream">
          {{ t('work.headline1') }}<br />
          <span class="font-serif font-normal italic text-main">{{ t('work.headline2') }}</span>
        </h2>
        <p class="mx-auto mt-7 max-w-xl text-sm leading-7 text-muted sm:text-base">
          {{ t('work.description') }}
        </p>
        <button type="button" class="mt-7 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream transition duration-300 hover:border-main hover:bg-main hover:text-canvas" @click="emit('contact')">
          {{ t('common.startProject') }} <span aria-hidden="true">↗</span>
        </button>
      </div>

      <div class="mt-11 flex flex-wrap items-center justify-center gap-2" :aria-label="t('work.filterLabel')">
        <button
          v-for="filter in filters"
          :key="filter.id"
          type="button"
          class="rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition duration-300"
          :class="activeFilter === filter.id ? 'border-main bg-main text-canvas' : 'border-white/10 bg-white/[0.025] text-muted hover:border-white/30 hover:text-cream'"
          :aria-pressed="activeFilter === filter.id"
          @click="activeFilter = filter.id"
        >
          {{ filter.name }}
        </button>
      </div>
    </div>

    <p v-if="!visibleProjects.length" class="relative mt-12 text-center text-muted">{{ t('data.noProjects') }}</p>
    <div class="relative mt-14 sm:mt-20">
      <div class="pointer-events-none absolute left-1/2 top-1/2 h-52 w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-main/20 blur-[90px]"></div>
      <div class="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-main/70 to-transparent shadow-[0_0_40px_10px_rgba(244,122,75,0.22)]"></div>


      <div
        ref="carousel"
        class="relative flex snap-x snap-mandatory items-center gap-4 overflow-x-auto px-[8%] py-10 [scrollbar-width:none] sm:px-[5.5%] sm:py-14 [&::-webkit-scrollbar]:hidden"
        :class="visibleProjects.length > 3 ? 'sm:justify-start sm:overflow-x-auto sm:gap-4' : 'sm:justify-center sm:overflow-visible sm:gap-2'"
      >
        <article
          v-for="(project, index) in visibleProjects"
          :key="`${project.id}-${index}`"
          class="group relative aspect-[9/14] w-[66vw] shrink-0 snap-center overflow-hidden rounded-[24px] border border-white/15 bg-[#161616] shadow-2xl transition duration-500 ease-out hover:!z-30 hover:![transform:translateY(-18px)_scale(1.04)] sm:w-[clamp(190px,23vw,310px)]"
          :class="cardPosition(index, visibleProjects.length)"
        >
          <button type="button" class="absolute inset-0 block h-full w-full text-start" :aria-label="t('work.viewProject', { title: project.title })" @click="emit('select', project)">
            <img :src="imageUrl(project.image)" :alt="`${project.client} — ${project.title}`" class="h-full w-full object-cover transition duration-700 group-hover:scale-105" :class="project.imageClass" loading="lazy" />
            <span class="absolute inset-0 bg-gradient-to-t from-black via-black/5 to-black/10"></span>
            <span class="absolute left-5 top-5 rounded-full border border-white/20 bg-black/25 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-white backdrop-blur-md">{{ project.category }}</span>
            <span class="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6">
              <span>
                <span class="block text-[10px] font-semibold uppercase tracking-[0.18em] text-main">{{ project.client }}</span>
                <span class="mt-2 block max-w-[12rem] text-2xl font-semibold leading-none tracking-[-0.04em] text-white">{{ project.title }}</span>
              </span>
              <span class="grid size-10 shrink-0 place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition duration-300 group-hover:border-main group-hover:bg-main group-hover:text-canvas">↗</span>
            </span>
          </button>
        </article>
      </div>
      <div v-if="visibleProjects.length > 3" class="relative z-30 mx-auto flex w-full justify-center gap-6">
        <button type="button" class="grid size-11 place-items-center rounded-full border border-white/15 bg-black/30 text-lg text-cream backdrop-blur-md transition hover:border-main hover:bg-main hover:text-canvas" :aria-label="t('work.previous')" @click="scrollProjects(-1)">{{ locale === 'ar' ? '→' : '←' }}</button>
        <button type="button" class="grid size-11 place-items-center rounded-full border border-white/15 bg-black/30 text-lg text-cream backdrop-blur-md transition hover:border-main hover:bg-main hover:text-canvas" :aria-label="t('work.next')" @click="scrollProjects(1)">{{ locale === 'ar' ? '←' : '→' }}</button>
      </div>
    </div>

    <div class="relative mx-auto mt-12 grid max-w-6xl gap-8 px-[5.5%] text-center sm:mt-16 sm:grid-cols-3 sm:gap-6">
      <article v-for="capability in capabilities" :key="capability.number" class="border-t border-white/10 pt-7 sm:px-5">
        <p class="text-[10px] font-semibold tracking-[0.2em] text-main">{{ capability.number }}</p>
        <h3 class="mt-3 text-lg font-semibold tracking-[-0.025em] text-cream">{{ capability.title }}</h3>
        <p class="mx-auto mt-3 max-w-xs text-xs leading-6 text-muted">{{ capability.copy }}</p>
      </article>
    </div>
  </section>
</template>
