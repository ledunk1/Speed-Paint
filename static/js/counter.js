// NOTE: This file creates a service worker that cross-origin-isolates the page (read more here: https://web.dev/coop-coep/) which allows us to use wasm threads.
// Normally you would set the COOP and COEP headers on the server to do this, but Github Pages doesn't allow this, so this is a hack to do that.

/* Edited version of: coi-serviceworker v0.1.6 - Guido Zuidhof, licensed under MIT */
// From here: https://github.com/gzuidhof/coi-serviceworker
if(typeof window === 'undefined') {
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

  async function handleFetch(request) {
    if(request.cache === "only-if-cached" && request.mode !== "same-origin") {
      return;
    }
    
    if(request.mode === "no-cors") { // We need to set `credentials` to "omit" for no-cors requests, per this comment: https://bugs.chromium.org/p/chromium/issues/detail?id=1309901#c7
      request = new Request(request.url, {
        cache: request.cache,
        credentials: "omit",
        headers: request.headers,
        integrity: request.integrity,
        destination: request.destination,
        keepalive: request.keepalive,
        method: request.method,
        mode: request.mode,
        redirect: request.redirect,
        referrer: request.referrer,
        referrerPolicy: request.referrerPolicy,
        signal: request.signal,
      });
    }
    
    let r = await fetch(request).catch(e => console.error(e));
    
    if(r.status === 0) {
      return r;
    }

    const headers = new Headers(r.headers);
    headers.set("Cross-Origin-Embedder-Policy", "credentialless"); // or: require-corp
    headers.set("Cross-Origin-Opener-Policy", "same-origin");
    
    return new Response(r.body, { status: r.status, statusText: r.statusText, headers });
  }

  self.addEventListener("fetch", function(e) {
    e.respondWith(handleFetch(e.request)); // respondWith must be executed synchonously (but can be passed a Promise)
  });
  
} else {
  (async function() {
    // Check if already cross-origin isolated
    if(window.crossOriginIsolated === true) {
      console.log("Already cross-origin isolated, skipping service worker registration");
      return;
    }

    // Prevent multiple registrations by checking if we're already in the process
    if(window.coiServiceWorkerRegistering) {
      console.log("Service worker registration already in progress");
      return;
    }
    
    // Mark as registering to prevent duplicate attempts
    window.coiServiceWorkerRegistering = true;

    try {
      let registration = await navigator.serviceWorker.register(window.document.currentScript.src).catch(e => {
        console.error("COOP/COEP Service Worker failed to register:", e);
        window.coiServiceWorkerRegistering = false;
        return null;
      });
      
      if(registration) {
        console.log("COOP/COEP Service Worker registered", registration.scope);

        // Add a flag to prevent infinite reloads
        const reloadKey = 'coi-sw-reload-attempted';
        const maxReloads = 3;
        let reloadCount = parseInt(sessionStorage.getItem(reloadKey) || '0');

        registration.addEventListener("updatefound", () => {
          if(reloadCount < maxReloads) {
            console.log("Service worker update found, reloading page...");
            sessionStorage.setItem(reloadKey, (reloadCount + 1).toString());
            window.location.reload();
          } else {
            console.warn("Max reload attempts reached, skipping reload to prevent infinite loop");
          }
        });

        // If the registration is active, but it's not controlling the page
        if(registration.active && !navigator.serviceWorker.controller) {
          if(reloadCount < maxReloads) {
            console.log("Service worker active but not controlling, reloading page...");
            sessionStorage.setItem(reloadKey, (reloadCount + 1).toString());
            window.location.reload();
          } else {
            console.warn("Max reload attempts reached, skipping reload to prevent infinite loop");
          }
        }

        // Clear reload counter after successful registration
        if(navigator.serviceWorker.controller) {
          sessionStorage.removeItem(reloadKey);
        }
      }
    } finally {
      window.coiServiceWorkerRegistering = false;
    }
  })();
}

// Code to deregister (for debugging):
// let registrations = await navigator.serviceWorker.getRegistrations();
// for(let registration of registrations) {
//   await registration.unregister();
// }