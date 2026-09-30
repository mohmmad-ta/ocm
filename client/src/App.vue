<script setup>
import { watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale, t } = useI18n()

watchEffect(() => {
  const isArabic = locale.value === 'ar'
  document.documentElement.lang = locale.value
  document.documentElement.dir = isArabic ? 'rtl' : 'ltr'
  document.title = t('meta.title')
  localStorage.setItem('ocm-locale', locale.value)
})
</script>

<template>
  <RouterView />
</template>
