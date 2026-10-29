// Firebase konsolundaki "Proje ayarları → Genel → Uygulamalarınız → Web uygulaması"
// bölümündeki firebaseConfig değerleri buraya yazılır.
// Bu değerler gizli değildir; güvenliği firestore.rules dosyasındaki kurallar sağlar.
export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: ''
};

// Uygulamaya giriş yapabilecek ekip üyelerinin e-postaları (küçük harfle).
// Aynı liste firestore.rules içinde de olmalı.
export const ALLOWED_EMAILS = [
  'hello@mossfilmagency.com'
];
