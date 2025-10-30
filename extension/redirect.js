const targetUrl = 'https://focusloom.ir'
const REDIRECT_DELAY_MS = 850
const TRANSITION_BUFFER_MS = 420

function beginRedirect() {
  const root = document.documentElement
  const startTransition = () => {
    root.classList.add('is-ready')

    window.setTimeout(() => {
      root.classList.add('is-redirecting')

      window.setTimeout(() => {
        window.location.replace(targetUrl)
      }, TRANSITION_BUFFER_MS)
    }, REDIRECT_DELAY_MS)
  }

  window.requestAnimationFrame(startTransition)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', beginRedirect, { once: true })
} else {
  beginRedirect()
}
