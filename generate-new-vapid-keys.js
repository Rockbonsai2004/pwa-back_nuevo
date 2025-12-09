// Archivo: generate-new-vapid-keys.js
import webpush from 'web-push';

console.log('🔑 GENERANDO NUEVAS CLAVES VAPID ÚNICAS...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ COPIA ESTAS CLAVES EN RENDER:\n');
console.log('========================================');
console.log('VAPID_PUBLIC_KEY:');
console.log(vapidKeys.publicKey);
console.log('\nVAPID_PRIVATE_KEY:');
console.log(vapidKeys.privateKey);
console.log('========================================');
console.log('\n📧 También necesitarás:');
console.log('VAPID_EMAIL=bruno.felix.22s@gmail.com');
console.log('\n⚠️  IMPORTANTE:');
console.log('1. Actualiza estas claves en Render');
console.log('2. Actualiza la misma clave pública en tu frontend');
console.log('3. Los usuarios necesitarán resuscribirse');