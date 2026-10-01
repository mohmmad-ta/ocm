export const resources = {
  projects: { endpoint: '/auth/admin/project', multipart: true, fields: [
    { key: 'name', required: true, min: 3, max: 120 },
    { key: 'description', type: 'textarea', max: 5000 },
    { key: 'company', type: 'select', source: 'companies', required: true },
    { key: 'category', type: 'select', source: 'categories', required: true },
    { key: 'year', type: 'number', min: 1900, max: 2200 },
    { key: 'services' },
  ], media: ['images', 'video'], toggles: ['active', 'featured'] },
  companies: { endpoint: '/auth/admin/company', fields: [
    { key: 'name', required: true, max: 120 }, { key: 'industry', max: 120 },
    { key: 'description', type: 'textarea', max: 5000 },
    { key: 'website', type: 'url', max: 500 },
    { key: 'logo', type: 'url' }, { key: 'image', type: 'url' },
  ], media: [], toggles: ['active'] },
  categories: { endpoint: '/category', fields: [
    { key: 'name', required: true }, { key: 'description', type: 'textarea' },
  ], media: [], toggles: [] },
  hero: { endpoint: '/auth/admin/hero-video', multipart: true, fields: [
    { key: 'name', required: true, max: 120 },
  ], media: ['video', 'poster', 'image'], toggles: ['active', 'autoplay', 'muted', 'loop'] },
}
