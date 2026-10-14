/* Sattam service worker - offline support */
const CACHE = 'sattam-v1';
const BASE = "/sattam-static-site";
const ASSETS = ["/sattam-static-site/","/sattam-static-site/","/sattam-static-site/help/","/sattam-static-site/guides/","/sattam-static-site/templates/","/sattam-static-site/glossary/","/sattam-static-site/deadlines/","/sattam-static-site/emergency/","/sattam-static-site/about/","/sattam-static-site/templates/police-complaint/","/sattam-static-site/templates/consumer-complaint/","/sattam-static-site/templates/rti-application/","/sattam-static-site/templates/salary-demand/","/sattam-static-site/templates/rent-notice/","/sattam-static-site/topic/know-your-rights/","/sattam-static-site/topic/everyday-laws/","/sattam-static-site/topic/rights-checklist/","/sattam-static-site/topic/police-procedures/","/sattam-static-site/topic/traffic-rules/","/sattam-static-site/topic/cybercrime/","/sattam-static-site/topic/consumer-rights/","/sattam-static-site/topic/employment-rights/","/sattam-static-site/topic/banking-safety/","/sattam-static-site/topic/housing-rental/","/sattam-static-site/topic/property-land/","/sattam-static-site/topic/family-law/","/sattam-static-site/topic/identity-documents/","/sattam-static-site/topic/tamil-nadu/","/sattam-static-site/topic/emergency-resources/","/sattam-static-site/know-your-rights/","/sattam-static-site/everyday-laws/","/sattam-static-site/police-procedures/","/sattam-static-site/traffic-rules/","/sattam-static-site/cybercrime/","/sattam-static-site/consumer-rights/","/sattam-static-site/employment-rights/","/sattam-static-site/banking-safety/","/sattam-static-site/housing-rental/","/sattam-static-site/property-land/","/sattam-static-site/family-law/","/sattam-static-site/identity-documents/","/sattam-static-site/emergency-resources/","/sattam-static-site/checklist-1-rights-police/","/sattam-static-site/checklist-2-road-cyber-consumer/","/sattam-static-site/checklist-3-work-money-family/","/sattam-static-site/checklist-4-government-daily/","/sattam-static-site/tn-government-services/","/sattam-static-site/tn-help-and-complaints/","/sattam-static-site/tn-rent-and-tenancy/","/sattam-static-site/assets/style.css","/sattam-static-site/assets/app.js","/sattam-static-site/assets/search-index.json","/sattam-static-site/manifest.webmanifest"];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(BASE + '/')))
  );
});
