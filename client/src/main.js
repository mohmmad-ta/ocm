import './assets/main.css'
import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'

import App from './App.vue'
import router from './router'
import en from './locales/en.json'
import ar from './locales/ar.json'

const app = createApp(App)
const savedLocale = localStorage.getItem('ocm-locale')
const requestedLocale = new URLSearchParams(window.location.search).get('lang')
const initialLocale = ['en', 'ar'].includes(requestedLocale)
  ? requestedLocale
  : ['en', 'ar'].includes(savedLocale)
    ? savedLocale
    : navigator.language.startsWith('ar') ? 'ar' : 'en'
const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'en',
  messages: { en, ar },
})

app.use(router)
app.use(i18n)

app.mount('#app')
