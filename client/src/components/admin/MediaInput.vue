<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
const props = defineProps({ field: String, required: Boolean })
const emit = defineEmits(['change', 'invalid'])
const { t } = useI18n()
const previews = ref([])
const video = computed(() => props.field === 'video')
const multiple = computed(() => props.field === 'images')
function clear() { previews.value.forEach(item => URL.revokeObjectURL(item.url)); previews.value = [] }
function select(event) {
  const files = [...event.target.files]
  const types = video.value ? ['video/mp4', 'video/webm', 'video/quicktime'] : ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  if (files.length > (multiple.value ? 8 : 1) || files.some(file => !types.includes(file.type) || file.size > (video.value ? 100 : 5) * 1024 * 1024)) {
    clear(); event.target.value = ''; emit('change', []); emit('invalid', t(video.value ? 'admin.videoLimit' : 'admin.imageLimit')); return
  }
  clear()
  previews.value = files.map(file => ({ name: file.name, url: URL.createObjectURL(file) }))
  emit('change', files)
}
onBeforeUnmount(clear)
</script>
<template>
  <div class="rounded-xl border border-dashed border-white/20 bg-white/[.02] p-4">
    <label class="block text-sm"><span>{{ t(`admin.${field}`) }}{{ required ? ' *' : '' }}</span><input :name="field" type="file" :required="required" :multiple="multiple" :accept="video ? 'video/mp4,video/webm,video/quicktime' : 'image/jpeg,image/png,image/webp,image/avif'" class="mt-3 block w-full text-xs text-muted file:me-3 file:rounded-lg file:border-0 file:bg-main/15 file:px-3 file:py-2 file:text-main" @change="select" /></label>
    <p class="mt-3 text-xs leading-5 text-muted">{{ t(video ? 'admin.videoLimit' : 'admin.imageLimit') }}</p>
    <div v-if="previews.length" class="mt-4 grid grid-cols-2 gap-3"><div v-for="item in previews" :key="item.url"><video v-if="video" :src="item.url" controls class="aspect-video w-full rounded-lg bg-black" /><img v-else :src="item.url" alt="" class="aspect-video w-full rounded-lg object-cover" /><p class="mt-1 truncate text-xs text-muted">{{ item.name }}</p></div></div>
  </div>
</template>
