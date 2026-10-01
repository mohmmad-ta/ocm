<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import api, { apiError, fetchAll, mediaUrl } from '../../../axios/axios'
import { resources } from '../../admin/resources'
import { usePortfolioStore } from '../../stores/portfolio'
import MediaInput from '../../components/admin/MediaInput.vue'
const route = useRoute()
const portfolio = usePortfolioStore()
const { t, locale } = useI18n()
const kind = computed(() => route.params.resource)
const config = computed(() => resources[kind.value])
const rows = ref([]), options = ref({ companies: [], categories: [] })
const search = ref(''), page = ref(1), loading = ref(false), error = ref(''), notice = ref('')
function emptyForm() {
  return {
    active: true,
    featured: false,
    autoplay: true,
    muted: true,
    loop: true,
    existingImages: [],
    removeVideo: false,
    removePoster: false,
    removeImage: false,
  }
}
const busy = ref(false), progress = ref(0), formError = ref(''), editing = ref(null), form = ref(emptyForm()), files = ref({})
const editor = ref(null), confirmDialog = ref(null), deleting = ref(null), formKey = ref(0)
const filtered = computed(() => rows.value.filter(item => `${item.name} ${item.company?.name || ''} ${item.category?.name || ''}`.toLowerCase().includes(search.value.toLowerCase())))
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / 10)))
const visible = computed(() => filtered.value.slice((page.value - 1) * 10, page.value * 10))
watch(search, () => { page.value = 1 })
watch(pages, value => { page.value = Math.min(page.value, value) })
let requestId = 0
async function load() {
  const id = ++requestId, resource = kind.value
  if (!resources[resource]) return
  loading.value = true; error.value = ''
  try {
    const [data, companies, categories] = await Promise.all([
      resource === 'hero' ? api.get(resources[resource].endpoint).then(r => r.data.data) : fetchAll(resources[resource].endpoint),
      resource === 'projects' ? fetchAll('/auth/admin/company') : [],
      resource === 'projects' ? fetchAll('/category') : [],
    ])
    if (id === requestId) { rows.value = data; options.value = { companies, categories } }
  } catch (err) { if (id === requestId) error.value = apiError(err, t('admin.connectionError')) }
  finally { if (id === requestId) loading.value = false }
}
watch(kind, () => {
  editor.value?.close()
  confirmDialog.value?.close()
  rows.value = []
  page.value = 1
  search.value = ''
  notice.value = ''
  editing.value = null
  form.value = emptyForm()
  files.value = {}
  load()
}, { immediate: true })
onBeforeRouteLeave(() => !busy.value)
onBeforeRouteUpdate(() => !busy.value)
function closeEditor() { if (!busy.value) editor.value.close() }
async function openEditor(item = null) {
  editing.value = item; files.value = {}; formError.value = ''; progress.value = 0; formKey.value++
  form.value = { ...emptyForm(), ...item,
    company: item?.company?._id || item?.company || '', category: item?.category?._id || item?.category || '',
    services: (item?.services || []).join(', '),
    existingImages: [...(item?.images?.length ? item.images : item?.image && kind.value === 'projects' ? [item.image] : [])],
    removeVideo: false, removePoster: false, removeImage: false,
  }
  await nextTick(); editor.value.showModal()
}
async function save() {
  formError.value = ''; busy.value = true; progress.value = 0
  const currentKind = kind.value, currentConfig = config.value
  try {
    const payload = {}
    for (const field of currentConfig.fields) {
      const value = form.value[field.key]
      if (field.key === 'services') payload.services = (value || '').split(',').map(v => v.trim()).filter(Boolean)
      else if (field.type === 'number') { if (value !== '' && value != null) payload[field.key] = Number(value) }
      else payload[field.key] = value ?? ''
    }
    for (const key of currentConfig.toggles) payload[key] = !!form.value[key]
    let body = payload
    if (currentConfig.multipart) {
      if (currentKind === 'projects') {
        const existingImages = form.value.existingImages ?? []
        if (existingImages.length + (files.value.images?.length || 0) < 1) throw new Error(t('admin.imageRequired'))
        if (existingImages.length + (files.value.images?.length || 0) > 8) throw new Error(t('admin.imageLimit'))
        payload.existingImages = existingImages
        payload.removeVideo = !!form.value.removeVideo
      } else {
        if (!editing.value && !files.value.video?.length) throw new Error(t('admin.videoRequired'))
        payload.removePoster = !!form.value.removePoster; payload.removeImage = !!form.value.removeImage
      }
      body = new FormData()
      Object.entries(payload).forEach(([key, value]) => body.append(key, Array.isArray(value) ? JSON.stringify(value) : String(value)))
      Object.entries(files.value).forEach(([key, values]) => values.forEach(file => body.append(key, file)))
    }
    const url = currentConfig.endpoint + (editing.value ? `/${editing.value._id}` : '')
    await api.request({ url, method: editing.value ? 'patch' : 'post', data: body, timeout: 180000,
      onUploadProgress: event => { progress.value = Math.round((event.loaded / (event.total || event.loaded)) * 100) },
    })
    portfolio.invalidate(); editor.value.close(); notice.value = t('admin.saved'); await load()
  } catch (err) { formError.value = err.response ? apiError(err, t('admin.connectionError')) : err.message || t('admin.connectionError') }
  finally { busy.value = false }
}
async function askDelete(item) { deleting.value = item; formError.value = ''; await nextTick(); confirmDialog.value.showModal() }
async function remove() {
  busy.value = true; formError.value = ''
  try { await api.delete(`${config.value.endpoint}/${deleting.value._id}`); portfolio.invalidate(); confirmDialog.value.close(); notice.value = t('admin.deleted'); await load() }
  catch (err) { formError.value = apiError(err, t('admin.connectionError')) }
  finally { busy.value = false }
}
function cancelDialog(event) { if (busy.value) event.preventDefault() }
</script>
<template>
  <div v-if="config">
    <div class="flex flex-wrap items-end justify-between gap-5"><div><p class="text-xs uppercase tracking-[.2em] text-main">{{ t('admin.content') }}</p><h1 class="mt-3 text-4xl font-semibold tracking-tight">{{ t(`admin.${kind}`) }}</h1><p class="mt-3 max-w-2xl text-sm leading-6 text-muted">{{ t(`admin.${kind}Hint`) }}</p></div><button :disabled="loading || busy" class="rounded-xl bg-main px-5 py-3 text-sm font-semibold text-canvas disabled:opacity-50" @click="openEditor()">+ {{ t('admin.addNew') }}</button></div>
    <p v-if="notice" role="status" class="mt-5 text-sm text-main">{{ notice }}</p>
    <div class="mt-8 flex gap-3"><input v-model="search" type="search" :aria-label="t('admin.search')" :placeholder="t('admin.search')" class="w-full max-w-sm rounded-xl border border-white/10 bg-[#171717] px-4 py-3 text-sm outline-none focus:border-main" /><button :disabled="loading || busy" class="rounded-xl border border-white/10 px-4 text-sm text-muted disabled:opacity-50" @click="load">{{ t('admin.refresh') }}</button></div>
    <p v-if="error" role="alert" class="mt-6 text-red-300">{{ error }}</p>
    <div class="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-[#121212]">
      <p v-if="loading" role="status" class="p-12 text-center text-muted">{{ t('data.loading') }}</p>
      <div v-else-if="!filtered.length" class="p-12 text-center"><p class="text-3xl text-main">✳</p><h2 class="mt-4 text-lg">{{ t(search ? 'admin.noResults' : 'admin.empty') }}</h2><p class="mt-2 text-sm text-muted">{{ t('admin.emptyCopy') }}</p></div>
      <table v-else class="w-full min-w-[570px] text-start text-sm"><thead class="border-b border-white/10 text-xs text-muted"><tr><th class="px-5 py-4 text-start font-normal">{{ t('admin.name') }}</th><th class="px-5 text-start font-normal">{{ t(kind === 'projects' ? 'admin.company' : 'admin.updated') }}</th><th v-if="kind !== 'categories'" class="px-5 text-start font-normal">{{ t('admin.status') }}</th><th class="px-5 text-end font-normal">{{ t('admin.actions') }}</th></tr></thead><tbody><tr v-for="item in visible" :key="item._id" class="border-b border-white/5 last:border-0 hover:bg-white/[.02]"><td class="px-5 py-5"><div class="flex items-center gap-3"><img v-if="item.image || item.poster || item.logo" :src="mediaUrl(item.image || item.poster || item.logo)" alt="" class="size-12 rounded-lg bg-white/5 object-cover" /><span v-else class="grid size-12 shrink-0 place-items-center rounded-lg bg-main/10 text-xl text-main">{{ kind === 'hero' ? '▷' : '✳' }}</span><div><p class="max-w-56 truncate font-medium">{{ item.name }}</p><p class="mt-1 text-xs text-muted">{{ item.category?.name || item.industry || item.slug || '' }}</p></div></div></td><td class="px-5 text-muted">{{ kind === 'projects' ? item.company?.name || '—' : item.updatedAt ? new Date(item.updatedAt).toLocaleDateString(locale) : '—' }}</td><td v-if="kind !== 'categories'" class="px-5"><span class="rounded-full px-3 py-1 text-xs" :class="item.active ? 'bg-main/10 text-main' : 'bg-white/5 text-muted'">{{ t(item.active ? 'admin.active' : 'admin.inactive') }}</span></td><td class="px-5 text-end"><div class="flex justify-end gap-4"><button :disabled="busy" class="text-main hover:underline" @click="openEditor(item)">{{ t('admin.edit') }}</button><button :disabled="busy" class="text-muted hover:text-red-300" @click="askDelete(item)">{{ t('admin.delete') }}</button></div></td></tr></tbody></table>
    </div>
    <div class="mt-5 flex items-center justify-between text-xs text-muted"><span>{{ t('admin.total', { count: filtered.length }) }}</span><div class="flex items-center gap-4"><button :disabled="page <= 1" class="disabled:opacity-30" @click="page--">{{ t('admin.previous') }}</button><span>{{ page }} / {{ pages }}</span><button :disabled="page >= pages" class="disabled:opacity-30" @click="page++">{{ t('admin.next') }}</button></div></div>
    <dialog ref="editor" class="max-h-[90svh] w-[min(760px,calc(100%-24px))] overflow-y-auto rounded-2xl border border-white/15 bg-[#151515] p-0 text-cream shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-sm" :aria-label="t(editing ? 'admin.edit' : 'admin.addNew')" @cancel="cancelDialog">
      <form :key="formKey" class="p-6 sm:p-8" @submit.prevent="save"><div class="mb-7 flex items-center justify-between"><h2 class="text-2xl font-semibold">{{ t(editing ? 'admin.edit' : 'admin.addNew') }} · {{ t(`admin.${kind}`) }}</h2><button type="button" :disabled="busy" :aria-label="t('admin.cancel')" class="px-2 text-2xl text-muted" @click="closeEditor">×</button></div>
        <fieldset :disabled="busy" class="space-y-6 disabled:opacity-60">
          <div class="grid gap-5 sm:grid-cols-2"><label v-for="field in config.fields" :key="field.key" class="block text-sm" :class="field.type === 'textarea' ? 'sm:col-span-2' : ''">{{ t(`admin.${field.key}`) }}{{ field.required ? ' *' : '' }}
            <textarea v-if="field.type === 'textarea'" v-model="form[field.key]" rows="4" :maxlength="field.max" class="mt-2 block w-full rounded-xl border border-white/15 bg-canvas p-3 outline-none focus:border-main" />
            <select v-else-if="field.type === 'select'" v-model="form[field.key]" :required="field.required" class="mt-2 block w-full rounded-xl border border-white/15 bg-canvas p-3 outline-none focus:border-main"><option value="">{{ t('admin.choose') }}</option><option v-for="option in options[field.source]" :key="option._id" :value="option._id">{{ option.name }}{{ option.active === false ? ` (${t('admin.inactive')})` : '' }}</option></select>
            <input v-else v-model="form[field.key]" :type="field.type || 'text'" :required="field.required" :min="field.type === 'number' ? field.min : undefined" :max="field.type === 'number' ? field.max : undefined" :minlength="field.type !== 'number' ? field.min : undefined" :maxlength="field.type !== 'number' ? field.max : undefined" class="mt-2 block w-full rounded-xl border border-white/15 bg-canvas p-3 outline-none focus:border-main" />
            <span v-if="field.key === 'services'" class="mt-1 block text-xs text-muted">{{ t('admin.servicesHint') }}</span>
          </label></div>
          <p v-if="kind === 'projects' && (!options.companies.length || !options.categories.length)" class="text-sm text-main">{{ t('admin.dependencies') }}</p>
          <div v-if="kind === 'projects' && form.existingImages?.length" class="grid grid-cols-3 gap-3"><div v-for="image in form.existingImages" :key="image" class="relative"><img :src="mediaUrl(image)" alt="" class="aspect-square w-full rounded-lg object-cover" /><button type="button" :aria-label="t('admin.removeImage')" class="absolute end-1 top-1 rounded-full bg-black/80 px-2 text-xl" @click="form.existingImages = form.existingImages.filter(i => i !== image)">×</button></div></div>
          <template v-for="field in config.media" :key="field"><div v-if="editing?.[field] && field !== 'images'" class="space-y-2"><video v-if="field === 'video'" :src="mediaUrl(editing[field])" controls preload="metadata" class="max-h-48 rounded-lg" /><img v-else :src="mediaUrl(editing[field])" alt="" class="h-28 rounded-lg object-cover" /><label v-if="!(kind === 'hero' && field === 'video')" class="flex items-center gap-2 text-sm text-muted"><input v-model="form[`remove${field[0].toUpperCase()}${field.slice(1)}`]" type="checkbox" class="accent-main" />{{ t('admin.removeCurrent') }} {{ t(`admin.${field}`) }}</label></div><MediaInput :field="field" :required="kind === 'hero' && field === 'video' && !editing" @change="files[field] = $event" @invalid="formError = $event" /></template>
          <div class="flex flex-wrap gap-5"><label v-for="key in config.toggles" :key="key" class="flex items-center gap-2 text-sm"><input v-model="form[key]" type="checkbox" class="size-4 accent-main" />{{ t(`admin.${key}`) }}</label></div>
        </fieldset>
        <p v-if="formError" role="alert" class="mt-5 whitespace-pre-line text-sm text-red-300">{{ formError }}</p>
        <p v-if="busy" role="status" class="mt-5 text-sm text-main">{{ t('admin.saving') }} {{ progress ? `${progress}%` : '' }}</p>
        <div class="mt-7 flex justify-end gap-3 border-t border-white/10 pt-6"><button type="button" :disabled="busy" class="rounded-xl border border-white/15 px-5 py-3 text-sm disabled:opacity-50" @click="closeEditor">{{ t('admin.cancel') }}</button><button :disabled="busy" class="rounded-xl bg-main px-6 py-3 text-sm font-semibold text-canvas disabled:opacity-50">{{ t(busy ? 'admin.saving' : 'admin.save') }}</button></div>
      </form>
    </dialog>
    <dialog ref="confirmDialog" class="w-[min(440px,calc(100%-24px))] rounded-2xl border border-white/15 bg-[#151515] p-7 text-cream backdrop:bg-black/80" :aria-label="t('admin.delete')" @cancel="cancelDialog"><h2 class="text-xl font-semibold">{{ t('admin.deleteTitle', { name: deleting?.name }) }}</h2><p class="mt-4 text-sm leading-6 text-muted">{{ t('admin.deleteCopy') }}</p><p v-if="formError" role="alert" class="mt-4 text-sm text-red-300">{{ formError }}</p><div class="mt-6 flex justify-end gap-3"><button :disabled="busy" class="rounded-lg border border-white/15 px-4 py-2" @click="confirmDialog.close()">{{ t('admin.cancel') }}</button><button :disabled="busy" class="rounded-lg bg-red-400 px-4 py-2 font-medium text-black disabled:opacity-50" @click="remove">{{ t(busy ? 'admin.saving' : 'admin.delete') }}</button></div></dialog>
  </div>
</template>
