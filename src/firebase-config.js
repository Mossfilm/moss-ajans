// Firebase konsolundaki "Proje ayarları → Genel → Uygulamalarınız → Web uygulaması"
// bölümündeki firebaseConfig değerleri buraya yazılır.
// Bu değerler gizli değildir; güvenliği firestore.rules dosyasındaki kurallar sağlar.
export const firebaseConfig = {
  apiKey: 'AIzaSyBKLlSC_BhA0XaoZZ9Ei-4zN2RZv6cj0OU',
  authDomain: 'moss-ajans.firebaseapp.com',
  projectId: 'moss-ajans',
  storageBucket: 'moss-ajans.firebasestorage.app',
  messagingSenderId: '819190008799',
  appId: '1:819190008799:web:d0cb5acdc8b95699d1926a'
};

// Uygulamaya giriş yapabilecek ekip üyelerinin e-postaları (küçük harfle).
// Aynı liste firestore.rules içinde de olmalı.
export const ALLOWED_EMAILS = [
  'hello@mossfilmagency.com'
];
