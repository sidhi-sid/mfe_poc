// ═══════════════════════════════════════════════════
//  Bank of Muscat — Client-side page router & iframe
// ═══════════════════════════════════════════════════

const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const CORE_URL = `http://${currentHost}:5173`
const LOAD_TIMEOUT_MS = 15_000

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

  // Load iframe on first visit to wealth page
  if (pageName === 'wealth' && !iframeLoaded) {
    loadIframe()
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

function loadIframe() {
  showLoading()
  iframe.src = CORE_URL

  loadTimer = setTimeout(() => {
    showError()
  }, LOAD_TIMEOUT_MS)
}

iframe.addEventListener('load', () => {
  showConnected()
})

retryBtn.addEventListener('click', () => {
  loadIframe()
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
