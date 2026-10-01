import { computed, onMounted, ref } from 'vue'
import api, { fetchAll, mediaUrl } from '../../axios/axios'

const records = ref({ projects: [], companies: [], categories: [], hero: null })
const loading = ref(false)
const error = ref(false)
let loaded = false
let pending

export function invalidatePortfolio() { loaded = false }

export async function loadPortfolio(force = false) {
  if (pending) return pending
  if (loaded && !force) return
  loading.value = true
  error.value = false
  pending = Promise.all([
    fetchAll('/project'), fetchAll('/company'), fetchAll('/category'),
    api.get('/hero-video').then(({ data }) => data.data).catch((err) => {
      if (err.response?.status === 404) return null
      throw err
    }),
  ]).then(([projects, companies, categories, hero]) => {
    records.value = { projects, companies, categories, hero }
    loaded = true
  }).catch(() => { error.value = true }).finally(() => {
    loading.value = false
    pending = null
  })
  return pending
}

export function usePortfolio() {
  onMounted(() => loadPortfolio())
  const projects = computed(() => records.value.projects.map((item) => ({
    ...item, id: item._id, title: item.name, cover: item.image,
    gallery: item.images || [], services: (item.services || []).join(' · '),
    categoryId: item.category?._id || '', category: item.category?.name || '',
    client: item.company?.name || '', companySlug: item.company?.slug || '',
    type: item.category?.name || '',
  })))
  const companies = computed(() => records.value.companies.map((item) => ({
    ...item, image: item.image || item.logo,
    projects: projects.value.filter((project) => project.company?._id === item._id),
  })))
  return {
    projects, companies, categories: computed(() => records.value.categories),
    hero: computed(() => records.value.hero), loading, error,
    reload: () => loadPortfolio(true),
    getProject: (slug) => projects.value.find((item) => item.slug === slug || item.id === slug),
    getCompany: (slug) => companies.value.find((item) => item.slug === slug || item._id === slug),
  }
}

export const portfolioImage = (path) => mediaUrl(path) || '/favicon.svg'
