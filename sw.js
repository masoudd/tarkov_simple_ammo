const CACHE_NAME = "offline";
const urlsToCache = [
    'index.html',
    'app.js',
    'style.css',
    'Bender.woff',
    'Bender-Bold.woff',
    'favicon.ico'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

/* delete other caches */
self.addEventListener('activate', event => {
    console.log('got activated');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') {
        return;
    }
    let response = fetch(event.request)
        .then(response => {
            // only cache the response if it's valid, 200,
            // and basic (it's from the same origin,
            // so we don't cache requests to third party origins
            if (response && response.ok && response.type == 'basic') {
                let responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                return response;
            }
        })
        .catch(response => {
//            console.log("fetch failed: ", response);
            return caches.match(event.request);
        });

//    console.log("fetch event for : ", event.request);
//    console.log("responding with: ", response);
    event.respondWith(response);
});
