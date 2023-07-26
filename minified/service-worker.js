const cacheName="ffmpegweb-cache",filestoCache=["./","./index.html","./script.js","./style.css","./assets/mergedAssets.json","./assets/logo.png","./manifest.json","https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@700&family=Work+Sans&display=swap","https://cdn.jsdelivr.net/npm/animate.css@4.1.1/animate.min.css","https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js","https://unpkg.com/@ffmpeg/ffmpeg@0.11.0/dist/ffmpeg.min.js","https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js"];async function networkFirst(t){try{var e=await fetch(t),s=await caches.open("ffmpegweb-cache");return await s.delete(t),await s.put(t,e.clone()),e}catch(e){return await caches.match(t)}}self.addEventListener("install",e=>{e.waitUntil(caches.open(cacheName).then(e=>e.addAll(filestoCache)))}),self.addEventListener("activate",e=>self.clients.claim()),self.addEventListener("fetch",e=>{var t=e.request;if(-1!==t.url.indexOf("updatecode"))return fetch(t);e.respondWith(networkFirst(t))});