import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  withCredentials: true,
  timeout: 30000,
})

export function mediaUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  if (!path.startsWith('/public/')) return ''
  const origin = import.meta.env.VITE_BACKEND_URL || new URL(api.defaults.baseURL, window.location.origin).origin
  return `${origin.replace(/\/$/, '')}${path}`
}

export function apiError(error, fallback) {
  return error?.response?.data?.message || fallback
}

export async function fetchAll(path) {
  const records = []
  for (let page = 1; ; page++) {
    const { data } = await api.get(path, { params: { page, limit: 100 } })
    records.push(...data.data)
    if (data.data.length < 100) return records
  }
}

export default api
