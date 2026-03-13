// ═══════════════════════════════════════════════════
//  Bank of Muscat — Client-side page router & iframe
// ═══════════════════════════════════════════════════

const CORE_URL = 'http://localhost:5173'
const LOAD_TIMEOUT_MS = 15_000
// Point directly to the dashboard Fastify backend (same as DASHBOARD_API_BASE)
const ONBOARDING_BASE_URL = 'http://localhost:4001/api/onboarding'
const DEFAULT_CIF_NUMBER = '999777'
const DEFAULT_ACCOUNT_TYPE = 'Individual'

// DOM refs
const pages = {
  home:   document.getElementById('page-home'),
  blog:   document.getElementById('page-blog'),
  wealth: document.getElementById('page-wealth'),
}

const navLinks      = document.querySelectorAll('[data-page]')
const navbar        = document.getElementById('navbar')
const mobileToggle  = document.getElementById('mobile-toggle')
const iframe        = document.getElementById('wealth-iframe')
const loadingEl     = document.getElementById('wealth-loading')
const errorEl       = document.getElementById('wealth-error')
const retryBtn      = document.getElementById('retry-btn')

let currentPage = 'home'
let iframeLoaded = false
let loadTimer = null
let onboardingInFlight = false

// ── Page navigation ───────────────────────────────
function navigateTo(pageName) {
  if (!pages[pageName]) return
  currentPage = pageName

  // Toggle page visibility
  Object.entries(pages).forEach(([name, el]) => {
    el.classList.toggle('active', name === pageName)
  })

  // Update active nav link
  navLinks.forEach(link => {
    const isMatch = link.dataset.page === pageName
    link.classList.toggle('active', isMatch)
  })

  // Scroll to top for non-iframe pages
  if (pageName !== 'wealth') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Load iframe on first visit to wealth page, but only
  // after we successfully hit the onboarding getWMURL API.
  if (pageName === 'wealth' && !iframeLoaded) {
    startWealthOnboardingFlow()
  }

  // Update browser title
  const titles = {
    home:   'Bank of Muscat — Leading Financial Solutions',
    blog:   'Blog — Bank of Muscat',
    wealth: 'Wealth App — Bank of Muscat',
  }
  document.title = titles[pageName] || titles.home
}

// ── Iframe management ─────────────────────────────
function showLoading() {
  loadingEl.style.display = ''
  loadingEl.classList.remove('hidden')
  errorEl.style.display = 'none'
  iframe.classList.remove('loaded')
}

function showError() {
  clearTimeout(loadTimer)
  loadingEl.classList.add('hidden')
  errorEl.style.display = ''
  iframe.classList.remove('loaded')
}

function showConnected() {
  clearTimeout(loadTimer)
  loadingEl.classList.add('hidden')
  errorEl.style.display = 'none'
  iframe.classList.add('loaded')
  iframeLoaded = true
}

function loadIframe(wmUrl) {
  showLoading()

  const url = new URL(CORE_URL)
  if (wmUrl) {
    url.searchParams.set('wmUrl', wmUrl)
    // Also pass the CIF number we used for getWMURL so the core app
    // can use a consistent identifier when fetching client details.
    url.searchParams.set('cifNumber', DEFAULT_CIF_NUMBER)
  }

  iframe.src = url.toString()

  loadTimer = setTimeout(() => {
    showError()
  }, LOAD_TIMEOUT_MS)
}

async function callGetWMURL() {
  const url = new URL(`${ONBOARDING_BASE_URL}/getWMURL`, window.location.origin)
  url.searchParams.set('cifNumber', DEFAULT_CIF_NUMBER)
  url.searchParams.set('accountType', DEFAULT_ACCOUNT_TYPE)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`getWMURL failed with status ${response.status}`)
  }

  const data = await response.json()
  return data
}

async function startWealthOnboardingFlow() {
  if (onboardingInFlight) {
    return
  }

  onboardingInFlight = true
  showLoading()

  try {
    const wmData = await callGetWMURL()
    const wmUrl = wmData && typeof wmData.url === 'string' ? wmData.url : null
    loadIframe(wmUrl)
  } catch (error) {
    console.error('Failed to start Wealth App onboarding:', error)
    showError()
  } finally {
    onboardingInFlight = false
  }
}

iframe.addEventListener('load', () => {
  showConnected()
})

retryBtn.addEventListener('click', () => {
  // Retry the full onboarding + iframe load flow
  iframeLoaded = false
  startWealthOnboardingFlow()
})

// ── Navigation event listeners ────────────────────
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault()
    navigateTo(link.dataset.page)
  })
})

// ── Navbar scroll effect ──────────────────────────
let ticking = false
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      navbar.classList.toggle('scrolled', window.scrollY > 10)
      ticking = false
    })
    ticking = true
  }
})

// ── Mobile menu toggle (basic) ────────────────────
mobileToggle.addEventListener('click', () => {
  const navLinksEl = document.querySelector('.nav-links')
  const navActionsEl = document.querySelector('.nav-actions')
  const isVisible = navLinksEl.style.display === 'flex'

  navLinksEl.style.display = isVisible ? 'none' : 'flex'
  navActionsEl.style.display = isVisible ? 'none' : 'flex'

  if (!isVisible) {
    navLinksEl.style.cssText = 'display:flex;position:absolute;top:64px;left:0;right:0;flex-direction:column;background:white;padding:16px 24px;border-bottom:1px solid #e5e7eb;box-shadow:0 4px 20px rgba(0,0,0,0.08);'
    navActionsEl.style.cssText = 'display:flex;position:absolute;top:' + (64 + navLinksEl.offsetHeight) + 'px;left:0;right:0;flex-direction:column;gap:8px;background:white;padding:0 24px 16px;border-bottom:1px solid #e5e7eb;'
  } else {
    navLinksEl.style.cssText = ''
    navActionsEl.style.cssText = ''
  }
})

// ── Init ──────────────────────────────────────────
navigateTo('home')
