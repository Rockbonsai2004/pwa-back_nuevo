import webpush from 'web-push';

console.log('🔑 Generando claves VAPID...\n');
const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ COPIA ESTAS CLAVES EN RENDER:\n');
console.log('======================================');
console.log('VAPID_PUBLIC_KEY:');
console.log(vapidKeys.publicKey);
console.log('\nVAPID_PRIVATE_KEY:');
console.log(vapidKeys.privateKey);
console.log('======================================');
console.log('\n📧 También necesitarás:');
console.log('VAPID_EMAIL=tu_email@gmail.com');
console.log('\n⚠️  Estas claves son SECRETAS, no las compartas!');