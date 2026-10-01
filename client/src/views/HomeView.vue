<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import Hero from '../components/Hero.vue'
import WorkSection from '../components/WorkSection.vue'
import ClientsSection from '../components/ClientsSection.vue'
import { usePortfolio, portfolioImage } from '../composables/usePortfolio'
import DataState from '../components/DataState.vue'

const { locale, t } = useI18n()
const router = useRouter()
const menuOpen = ref(false)
const activeFilter = ref('all')
const { projects, categories, loading, error, reload } = usePortfolio()
const filters = computed(() => [{ id: 'all', name: t('filters.all') }, ...categories.value.map(c => ({ id: c._id, name: c.name }))])
const services = computed(() => [
  { title: t('services.strategy.title'), text: t('services.strategy.text'), tags: t('services.strategy.tags') },
  { title: t('services.film.title'), text: t('services.film.text'), tags: t('services.film.tags') },
  { title: t('services.branding.title'), text: t('services.branding.text'), tags: t('services.branding.tags') },
  { title: t('services.content.title'), text: t('services.content.text'), tags: t('services.content.tags') },
])
const openService = ref(0)
const dialog = ref(null)
const selectedProject = ref(null)
const dialogType = ref('project')
const contact = ref({ name: '', email: '', service: 'strategy', message: '' })
const briefCreated = ref(false)
let previousFocus
const imageUrl = portfolioImage
async function openDialog(type, project = null) {
  if (!dialog.value?.open) previousFocus = document.activeElement
  dialogType.value = type
  selectedProject.value = project
  menuOpen.value = false
  briefCreated.value = false
  await nextTick()
  if (!dialog.value.open) dialog.value.showModal()
  document.body.classList.add('overflow-hidden')
}
function closeDialog() { dialog.value.close() }
function onDialogClose() { document.body.classList.remove('overflow-hidden'); previousFocus?.focus() }
function openProject(project) {
  router.push({ name: 'project', params: { projectSlug: project.slug }, query: { lang: locale.value } })
}
function downloadBrief() {
  const selectedService = contact.value.service === 'all'
    ? t('dialog.allServices')
    : t(`services.${contact.value.service}.title`)
  const text = `${t('brief.title')}\n\n${t('brief.name')}: ${contact.value.name}\n${t('brief.email')}: ${contact.value.email}\n${t('brief.service')}: ${selectedService}\n\n${t('brief.idea')}\n${contact.value.message}\n`
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url; link.download = 'OCM-project-brief.txt'; link.click()
  URL.revokeObjectURL(url)
  briefCreated.value = true
}
onBeforeUnmount(() => { document.body.classList.remove('overflow-hidden') })
</script>

<template>
  <div class="mx-auto max-w-[1800px] bg-[#090909] bg-[radial-gradient(circle_at_50%_34%,rgba(244,122,75,0.10),transparent_23%),radial-gradient(circle_at_50%_72%,rgba(244,122,75,0.08),transparent_21%)]">
    <Navbar
      v-model:menu-open="menuOpen"
      :project-count="projects.length"
      @contact="openDialog('contact')"
    />
    <main>
      <Hero />
      <DataState :loading="loading" :error="error" @retry="reload" />
      <div class="container border-b border-line py-[25px] sm:py-[35px] [&>div]:flex [&>div]:w-max [&>div]:items-center [&>div]:justify-around [&>div]:gap-[23px] [&>div]:whitespace-nowrap [&>div]:font-display [&>div]:text-[13px] [&>div]:font-[650] [&>div]:tracking-[-0.02em] sm:[&>div]:w-auto sm:[&>div]:gap-7 sm:[&>div]:text-[clamp(12px,1.7vw,27px)] [&_span]:text-[21px] [&_span]:font-normal [&_span]:text-main sm:[&_span]:text-[27px]" :aria-label="t('ticker.label')"><div>{{ t('ticker.strategy') }} <span>✳</span> {{ t('ticker.storytelling') }} <span>✳</span> {{ t('ticker.impact') }} <span>✳</span></div></div>
      <WorkSection
        v-model:active-filter="activeFilter"
        :projects="projects"
        :filters="filters"
        @select="openProject"
        @contact="openDialog('contact')"
      />
      <ClientsSection />
      <section id="about" class="container py-[62px] sm:py-20 lg:py-[105px] [&_h2]:mt-[18px] [&_h2]:font-display [&_h2]:text-[39px] [&_h2]:font-medium [&_h2]:leading-[1.15] [&_h2]:tracking-[-0.055em] sm:[&_h2]:mt-[22px] sm:[&_h2]:text-[clamp(37px,4.1vw,66px)] [&_h2_em]:font-serif [&_h2_em]:font-normal [&_h2_em]:tracking-[-0.06em] [&_h2_em]:text-main grid grid-cols-1 gap-[25px] border-y border-line sm:grid-cols-[1fr_2fr] sm:gap-[30px]"><div class="flex items-center gap-[11px] text-[9px] font-medium leading-[1.6] tracking-[1.9px] sm:text-[10px] text-muted self-start sm:pt-3.5">{{ t('about.eyebrow') }}</div><div class="[&_h2]:!m-0 [&_h2]:!text-[41px] sm:[&_h2]:!text-[clamp(38px,4.4vw,70px)]"><h2>{{ t('about.headline1') }}<br />{{ t('about.headline2') }}<span class="text-main"> {{ t('about.headline3') }}</span></h2><div class="mt-[30px] grid grid-cols-[55px_1fr] gap-[22px] max-[380px]:grid-cols-1 sm:mt-10 sm:grid-cols-[1fr_3fr] sm:gap-[30px] [&_p]:max-w-[520px] [&_p]:text-[13px] [&_p]:leading-[1.8] sm:[&_p]:text-[15px] [&_p+p]:mt-[17px] [&_p+p]:text-xs sm:[&_p+p]:text-[13px]"><span class="text-[58px] leading-[1.1] text-main max-[380px]:hidden sm:text-[90px]" aria-hidden="true">✳</span><div><p>{{ t('about.intro') }}</p><p class="text-muted">{{ t('about.copy') }}</p><a class="mt-[26px] inline-flex items-center gap-4 border-b border-[#77776e] pb-[9px] text-[10px] hover:text-main sm:gap-10 sm:text-xs [&_span]:text-[19px]" href="#services">{{ t('about.link') }} <span>↘</span></a></div></div></div></section>
      <section id="services" class="container py-[62px] sm:py-20 lg:py-[105px] [&_h2]:mt-[18px] [&_h2]:font-display [&_h2]:text-[39px] [&_h2]:font-medium [&_h2]:leading-[1.15] [&_h2]:tracking-[-0.055em] sm:[&_h2]:mt-[22px] sm:[&_h2]:text-[clamp(37px,4.1vw,66px)] [&_h2_em]:font-serif [&_h2_em]:font-normal [&_h2_em]:tracking-[-0.06em] [&_h2_em]:text-main grid grid-cols-1 gap-[35px] sm:grid-cols-[1fr_1.25fr] sm:gap-[6%] lg:gap-[9%] lg:!pb-[115px]"><div class="[&>p]:mt-[25px] [&>p]:text-xs [&>p]:leading-[1.8] sm:[&>p]:text-[13px]"><div class="flex items-center gap-[11px] text-[9px] font-medium leading-[1.6] tracking-[1.9px] sm:text-[10px] text-muted">{{ t('services.eyebrow') }}</div><h2>{{ t('services.headline1') }}<br />{{ t('services.headline2') }} <em>{{ t('services.headline3') }}</em></h2><p class="text-muted">{{ t('services.intro1') }}<br />{{ t('services.intro2') }}</p><button class="inline-flex items-center justify-between gap-[35px] rounded-[5px] bg-main px-6 py-[17px] text-[13px] font-semibold text-[#181816] transition duration-200 hover:-translate-y-0.5 hover:bg-[#ff946c] [&_span]:text-[22px] [&_span]:leading-none !mt-[29px] !border !border-[#63635b] !bg-transparent !px-[17px] !py-[13px] !text-[11px] !text-cream hover:!border-main hover:!bg-main hover:!text-[#141414]" @click="openDialog('contact')">{{ t('services.button') }} <span>↗</span></button></div><div class="pt-2.5"><div v-for="(service, index) in services" :key="service.title" class="border-b border-line first:border-t [&_h3_button]:flex [&_h3_button]:w-full [&_h3_button]:items-center [&_h3_button]:gap-[21px] [&_h3_button]:bg-transparent [&_h3_button]:py-[25px] [&_h3_button]:text-start [&_h3_button]:text-[19px] [&_h3_button]:font-[450] [&_h3_button]:tracking-[-0.5px] sm:[&_h3_button]:gap-[17px] sm:[&_h3_button]:py-[29px] sm:[&_h3_button]:text-[17px] lg:[&_h3_button]:gap-6 lg:[&_h3_button]:text-xl [&_h3_button:hover]:text-main" :class="{ '[&_h3_button]:text-main': openService === index }"><h3><button :aria-expanded="openService === index" :aria-controls="`service-${index}`" @click="openService = openService === index ? null : index"><span class="text-[10px] tracking-normal text-muted">0{{ index + 1 }}</span><span>{{ service.title }}</span><span class="ms-auto text-[25px] font-normal">{{ openService === index ? '−' : '+' }}</span></button></h3><div v-if="openService === index" :id="`service-${index}`" class="pb-7 ps-[35px] pe-[15px] sm:ps-[31px] lg:ps-[38px] [&_p]:max-w-[350px] [&_p]:text-[13px] [&_p]:leading-[1.7] [&_p]:text-[#c6c6bd] [&>span]:mt-[18px] [&>span]:block [&>span]:text-[9px] [&>span]:leading-[1.7] [&>span]:text-muted"><p>{{ service.text }}</p><span>{{ service.tags }}</span></div></div></div></section>
      <div id="contact" class="container">
        <section class="rounded-lg bg-main px-[7%] pb-[25px] pt-[27px] text-[#1b201c] sm:rounded-[10px] sm:px-[4.5%] sm:pb-[30px] sm:pt-[35px]"><div class="flex items-center justify-between"><div class="flex items-center gap-[11px] text-[9px] font-medium leading-[1.6] tracking-[1.9px] sm:text-[10px] max-w-[190px] !text-[6px] !leading-[1.7] !tracking-[.9px] sm:max-w-none sm:!text-[9px] sm:!leading-[1.6] sm:!tracking-[1.4px]"><span class="inline-block size-1.5 shrink-0 rounded-full bg-main shadow-[0_0_0_4px_#f47a4b18] !bg-[#1b201c] !shadow-[0_0_0_4px_#1b201c12]"></span> {{ t('cta.eyebrow') }}</div><span class="text-4xl leading-none sm:text-[47px]" aria-hidden="true">✳</span></div><button class="group/contact w-full bg-transparent py-[27px] text-start font-display text-[9.05vw] font-extrabold leading-[1.12] tracking-[-0.062em] sm:pb-[34px] sm:pt-[25px] sm:text-[clamp(36px,6.25vw,106px)] sm:leading-[1.09] [&>span]:font-serif [&>span]:font-normal [&>span]:italic [&_b]:ms-0.5 [&_b]:inline-block [&_b]:font-sans [&_b]:font-normal [&_b]:not-italic [&_b]:transition-transform [&_b]:duration-[250ms] sm:[&_b]:ms-[15px] [&:hover_b]:-translate-y-[9px] [&:hover_b]:translate-x-[9px]" @click="openDialog('contact')">{{ t('cta.line1') }}<br />{{ t('cta.line2') }} <span>{{ t('cta.line3') }} <b>↗</b></span></button><div class="flex items-center justify-between gap-3 border-t border-[#1b201c45] pt-4 text-[9px] max-[380px]:items-start max-[380px]:[&>p]:max-w-[110px] sm:gap-0 sm:pt-[22px] sm:text-xs"><p>{{ t('cta.copy') }}</p><button class="flex items-center gap-[15px] bg-transparent text-[10px] sm:gap-[60px] sm:text-xs [&_span]:text-2xl" @click="openDialog('contact')">{{ t('common.startProject') }} <span>↗</span></button></div></section>
      </div>
    </main>
    <Footer />
    <dialog ref="dialog" class="max-h-[90svh] w-[min(650px,calc(100%-32px))] rounded-xl border border-[#45453e] bg-[#1b1c19] p-0 text-cream backdrop:bg-[#090a09cc] backdrop:backdrop-blur-lg [&_h2]:my-[22px] [&_h2]:font-display [&_h2]:text-[35px] [&_h2]:font-medium [&_h2]:leading-[1.1] [&_h2]:tracking-[-2px] sm:[&_h2]:text-[43px] [&_p]:text-sm [&_p]:leading-[1.8] [&_p]:text-[#b1b2aa] [&_form]:mt-[25px] [&_label]:mb-[18px] [&_label]:flex [&_label]:flex-col [&_label]:gap-[9px] [&_label]:text-[11px] [&_input]:w-full [&_input]:rounded [&_input]:border [&_input]:border-[#44453c] [&_input]:bg-[#23241f] [&_input]:p-3 [&_input]:text-[13px] [&_select]:w-full [&_select]:rounded [&_select]:border [&_select]:border-[#44453c] [&_select]:bg-[#23241f] [&_select]:p-3 [&_select]:text-[13px] [&_textarea]:min-h-[100px] [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded [&_textarea]:border [&_textarea]:border-[#44453c] [&_textarea]:bg-[#23241f] [&_textarea]:p-3 [&_textarea]:text-[13px]" aria-labelledby="dialog-title" @close="onDialogClose" @click="($event.target === dialog) && closeDialog()"><div class="relative px-6 py-[35px] sm:p-10"><button class="absolute end-4 top-3 bg-transparent p-[5px] text-[32px] leading-none text-muted" :aria-label="t('common.closeDialog')" @click="closeDialog()">×</button>
      <template v-if="dialogType === 'project' && selectedProject"><div class="flex items-center gap-[11px] text-[9px] font-medium leading-[1.6] tracking-[1.9px] sm:text-[10px] text-main">{{ selectedProject.type }} / {{ selectedProject.client }}</div><h2 id="dialog-title">{{ selectedProject.title }}</h2><img class="mb-6 h-[230px] w-full rounded-[5px] object-cover sm:h-[270px]" :src="imageUrl(selectedProject.image, 1200)" :alt="t('dialog.projectVisual', { client: selectedProject.client })" :class="selectedProject.imageClass" /><p>{{ selectedProject.description }}</p><p class="!mb-[25px] !mt-5 !text-[11px] !text-main">{{ selectedProject.services }}</p><button class="inline-flex items-center justify-between gap-[35px] rounded-[5px] bg-main px-6 py-[17px] text-[13px] font-semibold text-[#181816] transition duration-200 hover:-translate-y-0.5 hover:bg-[#ff946c] [&_span]:text-[22px] [&_span]:leading-none" @click="openDialog('contact')">{{ t('dialog.projectCta') }} <span>↗</span></button></template>
      <template v-else><div class="flex items-center gap-[11px] text-[9px] font-medium leading-[1.6] tracking-[1.9px] sm:text-[10px] text-main">{{ t('dialog.eyebrow') }}</div><h2 id="dialog-title">{{ t('dialog.title1') }}<br />{{ t('dialog.title2') }}</h2><p>{{ t('dialog.intro') }}</p><form @submit.prevent="downloadBrief"><div class="grid grid-cols-1 sm:grid-cols-2 sm:gap-[15px]"><label>{{ t('dialog.name') }}<input v-model="contact.name" autocomplete="name" :placeholder="t('dialog.namePlaceholder')" required maxlength="100" /></label><label>{{ t('dialog.email') }}<input v-model="contact.email" type="email" autocomplete="email" :placeholder="t('dialog.emailPlaceholder')" required maxlength="200" /></label></div><label>{{ t('dialog.service') }}<select v-model="contact.service"><option value="strategy">{{ t('services.strategy.title') }}</option><option value="film">{{ t('services.film.title') }}</option><option value="branding">{{ t('services.branding.title') }}</option><option value="content">{{ t('services.content.title') }}</option><option value="all">{{ t('dialog.allServices') }}</option></select></label><label>{{ t('dialog.message') }}<textarea v-model="contact.message" rows="4" :placeholder="t('dialog.messagePlaceholder')" required maxlength="5000"></textarea></label><button class="inline-flex items-center justify-between gap-[35px] rounded-[5px] bg-main px-6 py-[17px] text-[13px] font-semibold text-[#181816] transition duration-200 hover:-translate-y-0.5 hover:bg-[#ff946c] [&_span]:text-[22px] [&_span]:leading-none" type="submit">{{ t('dialog.download') }} <span>↗</span></button><p class="!mt-[13px] !text-[10px]">{{ t('dialog.privacy') }}</p><p v-if="briefCreated" role="status" class="!mt-3 !text-xs !text-main">{{ t('dialog.ready') }}</p></form></template>
    </div></dialog>
  </div>
</template>
