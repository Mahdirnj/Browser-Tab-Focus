const targetUrl = 'https://focusloom.ir'

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.location.replace(targetUrl)
  })
} else {
  window.location.replace(targetUrl)
}
