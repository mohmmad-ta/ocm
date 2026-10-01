import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import api, { fetchAll, mediaUrl } from '../../axios/axios'

export const usePortfolioStore = defineStore('portfolio', () => {
  const records = ref({ projects: [], companies: [], categories: [], hero: null })
  const loading = ref(false)
  const error = ref(false)
  let loaded = false
  let pending

  const projects = computed(() => records.value.projects.map((item) => ({
    ...item,
    id: item._id,
    title: item.name,
    cover: item.image,
    gallery: item.images || [],
    services: (item.services || []).join(' · '),
    categoryId: item.category?._id || '',
    category: item.category?.name || '',
    client: item.company?.name || '',
    companySlug: item.company?.slug || '',
    type: item.category?.name || '',
  })))

  const companies = computed(() => records.value.companies.map((item) => ({
    ...item,
    image: item.image || item.logo,
    projects: projects.value.filter((project) => project.company?._id === item._id),
  })))

  const categories = computed(() => records.value.categories)
  const hero = computed(() => records.value.hero)

  async function load(force = false) {
    if (pending) return pending
    if (loaded && !force) return
    loading.value = true
    error.value = false
    pending = Promise.all([
      fetchAll('/project'),
      fetchAll('/company'),
      fetchAll('/category'),
      api.get('/hero-video').then(({ data }) => data.data).catch((requestError) => {
        if (requestError.response?.status === 404) return null
        throw requestError
      }),
    ]).then(([projectRows, companyRows, categoryRows, activeHero]) => {
      records.value = {
        projects: projectRows,
        companies: companyRows,
        categories: categoryRows,
        hero: activeHero,
      }
      loaded = true
    }).catch(() => {
      error.value = true
    }).finally(() => {
      loading.value = false
      pending = null
    })
    return pending
  }

  function invalidate() {
    loaded = false
  }

  const reload = () => load(true)
  const getProject = (slug) => projects.value.find((item) => item.slug === slug || item.id === slug)
  const getCompany = (slug) => companies.value.find((item) => item.slug === slug || item._id === slug)

  return {
    records,
    projects,
    companies,
    categories,
    hero,
    loading,
    error,
    load,
    reload,
    invalidate,
    getProject,
    getCompany,
  }
})

export const portfolioImage = (path) => mediaUrl(path) || '/favicon.svg'
