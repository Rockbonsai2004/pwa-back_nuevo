import webpush from 'web-push';

const vapidKeys = webpush.generateVAPIDKeys();

console.log('🔑 CLAVES VAPID GENERADAS:');
console.log('============================');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('============================');
console.log('\n⚠️  COPIA ESTAS CLAVES EN TU .env');