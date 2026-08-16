self.addEventListener('activate', (event) => {
  event.waitUntil(caches.delete('profai-app-assets'))
})
