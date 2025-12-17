const CACHE_NAME = 'auditors-guide-cache-v1';
const urlsToCache = [
  '/',
  'index.html',
  'index.tsx',
  'App.tsx',
  'types.ts',
  'mockData.ts',
  'services/geminiService.ts',
  'services/googleDriveService.ts',
  'services/googleDrivePickerService.ts',
  'components/AdminPanel.tsx',
  'components/AppCatalog.tsx',
  'components/AuditLog.tsx',
  'components/ChangePasswordModal.tsx',
  'components/ChatAssistant.tsx',
  'components/ConfirmRoleChangeModal.tsx',
  'components/CreateTemplateModal.tsx',
  'components/Dashboard.tsx',
  'components/DocumentDetailModal.tsx',
  'components/DocumentManager.tsx',
  'components/DocumentPreview.tsx',
  'components/EditDocumentModal.tsx',
  'components/Header.tsx',
  'components/icons.tsx',
  'components/InspectionForm.tsx',
  'components/InspectionManager.tsx',
  'components/InspectionPlanner.tsx',
  'components/InviteUserModal.tsx',
  'components/Login.tsx',
  'components/ManageAreasModal.tsx',
  'components/Reporting.tsx',
  'components/SaveSopModal.tsx',
  'components/Scheduler.tsx',
  'components/Settings.tsx',
  'components/Sidebar.tsx',
  'components/SopGenerator.tsx',
  'components/SopTemplates.tsx',
  'components/StartInspectionModal.tsx',
  'components/TeamManager.tsx',
  'components/UploadPreviewModal.tsx',
  'components/UserProfile.tsx',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Check if we received a valid response. Allow 'cors' for CDN resources.
            if(!response || response.status !== 200 || !['basic', 'cors'].includes(response.type)) {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
    );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
