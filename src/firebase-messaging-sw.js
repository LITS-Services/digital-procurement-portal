// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.10.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBxm2YZhRXkQNU9kpK33SFYIrmW-rqTTcI",
   authDomain: "portal-1d075.firebaseapp.com",
   projectId: "portal-1d075",
   storageBucket: "portal-1d075.firebasestorage.app",
   messagingSenderId: "552612021319",
   appId: "1:552612021319:web:8aecc40c6bb250f342dd62",
   measurementId: "G-RP9QMZ2758"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/assets/icons/icon-72x72.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
