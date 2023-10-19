const CACHE_NAME = 'v2';
const urlsToCache = [
    'index.html',
    'app.js',
    'style.css',
    'Bender.woff',
    'Bender-Bold.woff'
];

const cacheAllowList = [
    CACHE_NAME,
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheAllowList.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', function(event) {
    const url = new URL(event.request.url);
    if (urlsToCache.indexOf(url.pathname) != -1) { // return cached response
        event.respondWith(caches.match(event.request).then(function(response) {
            if (response !== undefined) {
                return response;
            } else {
                console.log('This should have been cached, but it\'s not...', event);
                return fetch(event.request).then(function(response) {
                    let responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {cache.put(event.request, responseClone);});
                    return response;
                });
            }
        }));
    } else {  // do not return cached response unless we're offline
        event.respondWith(fetch(event.request)
            .then(function(response) {
                /* only cache the response if it's valid, 200,
                 * and basic (it's from the same origin. so we don't cache requests to third party origins */
                if (response && response.status == 200 && response.type == 'basic') {
                    let responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {cache.put(event.request, responseClone);});
                }
                return response;
            })
            .catch(function(response) { // we're offline
                return caches.match(event.request).then(response => {
                    if (response !== undefined) {
                        return response;
                    } else {
                        console.log('Network is down and this resource is not yet cached', event);
                        return new Response('You are offline and this page is not cached');
                    }
                });

            })
        );
    }
});
