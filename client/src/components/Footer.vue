<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <footer class="container flex flex-wrap items-center gap-5 py-[35px] sm:flex-nowrap sm:gap-[25px] sm:py-[45px] lg:gap-10 [&_a:hover]:text-main [&>p]:text-[10px] [&>p]:text-muted sm:[&>p]:text-[11px] [&>div]:m-0 [&>div]:flex [&>div]:w-full [&>div]:justify-between [&>div]:gap-[18px] [&>div]:pt-2.5 [&>div]:text-[10px] [&>div]:text-muted sm:[&>div]:ml-auto sm:[&>div]:w-auto sm:[&>div]:justify-normal sm:[&>div]:pt-0 lg:[&>div]:gap-[35px]">
    <a dir="ltr" class="relative pr-[18px] font-display text-[43px] font-extrabold leading-none tracking-[-4px] sm:text-[53px] sm:tracking-[-5px] !pr-3.5 !text-[40px] !tracking-[-4px]" href="#" :aria-label="t('nav.home')">
      ocm<span class="absolute right-0 top-1 font-sans text-sm tracking-normal !text-[10px]">®</span>
    </a>

    <p>{{ t('footer.tagline') }}</p>

    <div>
      <span>© {{ new Date().getFullYear() }} OCM</span>
      <a href="#">{{ t('common.backToTop') }}</a>
    </div>
  </footer>
</template>
