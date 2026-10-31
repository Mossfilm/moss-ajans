import { installFakeFunctions } from './fake/functions.js';
installFakeFunctions({});
import { doc, setDoc } from 'firebase/firestore';
// Test: anlık asistan bağlı (sahte Gemini anahtarı)
setDoc(doc({}, 'config', 'app'), { geminiKey: 'test-anahtar' }).then(() => import('../src/main.jsx'));
