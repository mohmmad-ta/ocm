<script setup>
import { useI18n } from 'vue-i18n'
defineProps({ loading: Boolean, error: Boolean })
defineEmits(['retry'])
const { t } = useI18n()
</script>
<template>
  <div v-if="loading || error" class="container py-16 text-center text-muted" role="status">
    <p>{{ t(loading ? 'data.loading' : 'data.error') }}</p>
    <button v-if="error && !loading" class="mt-4 rounded-lg border border-main px-5 py-2 text-main" @click="$emit('retry')">{{ t('data.retry') }}</button>
  </div>
</template>
