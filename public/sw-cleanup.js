self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await Promise.all(
      (await caches.keys())
        .filter((name) => name === 'profai-app-assets' || name.startsWith('profai-app-assets-'))
        .map((name) => caches.delete(name)),
    )
    // Activating a deployment must not navigate open tabs or interrupt refresh
    // token rotation. New documents will load the latest assets normally.
  })())
})
