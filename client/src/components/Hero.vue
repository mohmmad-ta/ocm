<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePortfolio, portfolioImage } from '../composables/usePortfolio'
import { mediaUrl } from '../../axios/axios'

const { locale, t } = useI18n()

const { hero, projects } = usePortfolio()
const displayColumns = computed(() => {
  const images = [hero.value?.image, hero.value?.poster, ...projects.value.map(p => p.image)].filter(Boolean)
  if (!images.length && !hero.value?.video) return []
  return Array.from({ length: 6 }, (_, col) => Array.from({ length: 3 }, (_, row) => ({
    image: images[(col + row) % images.length], position: 'object-center',
  })))
})

const animationDelayClasses = [
  '[animation-delay:0s]',
  '[animation-delay:-4s]',
  '[animation-delay:-8s]',
  '[animation-delay:-12s]',
  '[animation-delay:-16s]',
  '[animation-delay:-20s]',
]

const photoUrl = portfolioImage
const heroVideoUrl = computed(() => mediaUrl(hero.value?.video))

function setVideoOffset(event, columnIndex, videoIndex) {
  const video = event.currentTarget
  if (!Number.isFinite(video.duration) || video.duration <= 0) return
  video.currentTime = ((columnIndex * 3 + videoIndex) * 1.7) % video.duration
  if (hero.value?.autoplay) video.play().catch(() => {})
}
</script>

<template>
  <section
    class="relative isolate overflow-hidden rounded-b-lg bg-[#090909] sm:flex sm:min-h-[640px] sm:items-center sm:rounded-xl lg:min-h-[690px]"
    aria-labelledby="hero-title"
  >
    <!-- The tilted columns create the photo-wall perspective from the reference. -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        class="absolute -left-[80%] -right-[80%] -top-[4%] grid grid-cols-6 gap-1 [transform:perspective(1200px)_rotateY(-7deg)_rotateZ(12deg)] sm:-left-[12%] sm:-right-[12%] sm:-top-[35%] sm:gap-3 lg:-top-[48%]"
      >
        <div
          v-for="(column, columnIndex) in displayColumns"
          :key="columnIndex"
        >
          <div
            class="flex animate-hero-loop flex-col gap-1 [will-change:translate] motion-reduce:animate-none"
            :class="animationDelayClasses[columnIndex]"
          >
            <div v-for="copyIndex in 2" :key="copyIndex" class="flex flex-col gap-1">
              <div
                v-for="(photo, photoIndex) in column"
                :key="`${copyIndex}-${columnIndex}-${photoIndex}`"
                class="aspect-[9/16] shrink-0 overflow-hidden rounded-[3px] bg-[#090909] shadow-[0_12px_30px_#0006]"
              >
                <video
                  v-if="heroVideoUrl"
                  :key="heroVideoUrl"
                  :src="heroVideoUrl"
                  :poster="photoUrl(hero?.poster || photo.image)"
                  :class="photo.position"
                  class="size-full object-cover brightness-[.85] saturate-[.75]"
                  :autoplay="hero?.autoplay"
                  :muted="hero?.muted"
                  :loop="hero?.loop"
                  playsinline
                  preload="metadata"
                  aria-hidden="true"
                  @loadedmetadata="setVideoOffset($event, columnIndex, photoIndex)"
                ></video>
                <img v-else :src="photoUrl(photo.image)" alt="" class="size-full object-cover brightness-[.85] saturate-[.75]" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="absolute inset-0 bg-[linear-gradient(180deg,#090909ed_0%,#090909c9_43%,#09090955_72%,#090909d9_100%)] sm:bg-[linear-gradient(90deg,#090909_0%,#090909f5_25%,#090909c7_46%,#09090955_72%,#09090922_100%)]"></div>
      <div class="absolute inset-0 bg-[linear-gradient(180deg,#09090966_0%,transparent_24%,transparent_72%,#090909d9_100%)]"></div>
      <div class="absolute -left-32 top-1/4 size-80 rounded-full bg-main/[0.06] blur-[100px]"></div>
    </div>

    <div class="relative w-full z-10 container">
      <div class="pb-[345px] pt-11 sm:w-[61%] sm:pb-24 sm:pt-16 lg:w-[57%] lg:py-20">
        <p class="mb-8 flex items-center gap-2.5 text-[8px] font-medium uppercase tracking-[2.5px] text-cream/65 sm:mb-10 sm:text-[9px] lg:tracking-[3.5px]">
          <span class="size-1.5 shrink-0 rounded-full bg-main"></span>
        {{ t('hero.eyebrow') }}
      </p>

      <p class="mb-3 text-[10px] font-bold uppercase tracking-[1.5px] sm:text-[11px]">{{ t('hero.kicker') }}</p>
      <h1
        id="hero-title"
        class="text-[clamp(48px,13.7vw,88px)] uppercase tracking-[-0.025em] sm:text-[clamp(62px,7.7vw,130px)]"
        :class="locale === 'ar' ? 'font-sans font-bold leading-[1.3]' : 'font-impact font-normal leading-[1.04]'"
      >
        {{ t('hero.title1') }}<br />
        {{ t('hero.title2') }}<br />
        <span class="text-main">{{ t('hero.title3') }}</span>
      </h1>

        <div class="mt-5 max-w-[360px] border-t-2 border-cream/85 pt-4 sm:mt-6 sm:pt-5">
          <p class="max-w-[310px] text-xs leading-[1.8] text-cream/65 sm:text-[13px]">
          {{ t('hero.description') }}
          </p>
          <a
              href="#work"
              class="mt-5 inline-flex items-center gap-8 rounded bg-main px-5 py-3 text-[11px] font-semibold text-canvas transition duration-200 hover:-translate-y-0.5 hover:bg-[#ff946c] sm:mt-6"
          >
          {{ t('hero.explore') }} <span class="text-xl leading-none" aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </div>

    <div class="absolute right-6 top-6 hidden -rotate-6 border border-main/50 bg-canvas/75 px-4 py-3 text-[9px] font-semibold leading-[1.7] tracking-[2px] text-cream backdrop-blur-md lg:block" aria-hidden="true">
      {{ t('hero.stamp1') }}<br />{{ t('hero.stamp2') }}<br /><span class="text-main">{{ t('hero.stamp3') }}</span>
    </div>

    <div class="absolute bottom-6 left-[7%] right-[7%] z-10 flex items-center justify-between text-[7px] uppercase tracking-[1.5px] text-cream/60 sm:bottom-7 sm:left-[5%] sm:right-[5%] sm:text-[8px]">
      <span>{{ t('hero.perspectives') }}</span>
      <a href="#work" class="flex items-center gap-3 transition-colors hover:text-main">
        <span class="hidden sm:inline">{{ t('hero.scroll') }}</span>
        <span class="text-lg" aria-hidden="true">↓</span>
        <span class="sr-only sm:hidden">{{ t('hero.discover') }}</span>
      </a>
    </div>
  </section>
</template>
