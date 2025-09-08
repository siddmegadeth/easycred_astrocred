importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

const staticDevCoffee = "easycred-v1"
const assets = [
    "/",
    "index.html",
    "init.js"
]

self.addEventListener("install", installEvent => {
    console.log("Service Worker installing.")

    installEvent.waitUntil(
        caches.open(staticDevCoffee).then(cache => {
            cache.addAll(assets)
        })
    )
})


self.addEventListener("activate", (event) => {
    console.log("Service Worker activating.")
})

self.addEventListener("fetch", (event) => {
    console.log("Service Worker fetch.")
})

// self.addEventListener("push", async function(e) {
//     const data = e.data.json()

//     console.log("push event", data)
// // self.registration.showNotification(data.title, {
// //     body: data.body,
// // })
// })

// This is the "Offline copy of pages" service worker

const CACHE = "pwabuilder-offline";


self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

workbox.routing.registerRoute(
  new RegExp('/*'),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: CACHE
  })
);