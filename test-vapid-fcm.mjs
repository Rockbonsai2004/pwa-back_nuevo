// test-vapid-fcm.mjs
import webpush from 'web-push';

// 1. PEGA AQUÍ TUS CLAVES NUEVAS (las que generaste)
const VAPID_PUBLIC_KEY = 'BGStOhEB2Urn5809Z3b8oH5AQtDAhzXRGhebJNZ0gm2n3k6IXAq8cjsoVCdbgw-iVv5FRiLOudNRPIE1m6aEV1E';
const VAPID_PRIVATE_KEY = '5topG9_9kjvVlKwjk3SysEKtkSNryN3iPKEK-fOuoUA';
const VAPID_EMAIL = 'inunza2004@gmail.com';

console.log('🧪 INICIANDO PRUEBA DE CLAVES VAPID PARA FCM...\n');
console.log('📌 Clave Pública (inicio):', VAPID_PUBLIC_KEY.substring(0, 30) + '...');
console.log('📌 Longitud Clave Pública:', VAPID_PUBLIC_KEY.length);
console.log('📌 Longitud Clave Privada:', VAPID_PRIVATE_KEY.length);

// 2. Configurar web-push
try {
    webpush.setVapidDetails(
        `mailto:${VAPID_EMAIL}`,
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
    );
    console.log('✅ web-push configurado con las claves proporcionadas');
} catch (configError) {
    console.error('❌ ERROR configurando web-push:', configError.message);
    process.exit(1);
}

// 3. Crear una suscripción de PRUEBA
const testSubscription = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/fake-token-for-test',
    keys: {
        p256dh: 'BEmLdH6u7NpR5CVEYqyFFeNpCqK8bvozZqTLWz7U',
        auth: 'wKq7Gp7mTjqR8Kq7Gp7mTjqR'
    }
};

const payload = JSON.stringify({ 
    title: 'Test de JWT VAPID',
    body: 'Esta es una prueba de las credenciales VAPID',
    icon: '/icon.png'
});

console.log('\n🔍 Intentando generar y enviar petición a FCM (simulada)...');

// 4. Intentar generar la notificación
try {
    // NOTA: webpush.sendNotification devuelve una promesa
    await webpush.sendNotification(testSubscription, payload);
    console.log('✅✅✅ ÉXITO CRÍTICO ✅✅✅');
    console.log('Las claves VAPID son VÁLIDAS y web-push generó un JWT aceptado.');
    console.log('\n💡 Diagnóstico: El problema NO son las claves en sí.');
    console.log('   Posibles causas:');
    console.log('   1. Suscripciones ANTIGUAS en la base de datos');
    console.log('   2. Cache del Service Worker en el navegador');
    console.log('   3. Faltó reiniciar el servicio en Render');
    console.log('   4. Configuración incorrecta en el frontend');
    
    console.log('\n🚀 Acciones requeridas:');
    console.log('   a) Ejecutar en MongoDB: db.users.updateMany({}, { $set: { pushSubscriptions: [] } })');
    console.log('   b) Limpiar caché del navegador (chrome://settings/content/notifications)');
    console.log('   c) Reiniciar servicio en Render (Manual Deploy)');
    console.log('   d) Volver a suscribir usuarios desde la app en Vercel');
    
} catch (error) {
    console.log('\n❌ ERROR AL GENERAR/ENVIAR JWT:');
    console.log('Mensaje:', error.message);
    console.log('Código:', error.statusCode);
    console.log('Cuerpo del error:', error.body || 'No hay cuerpo de error');
    
    if (error.statusCode === 403 && error.body && error.body.includes('invalid JWT')) {
        console.log('\n🔴 DIAGNÓSTICO: FCM está RECHAZANDO el JWT generado.');
        console.log('💡 SOLUCIÓN ALTERNATIVA:');
        console.log('   1. Regenerar claves con método alternativo');
        
        // Script para regenerar claves
        console.log('\n📝 Para regenerar claves, crea generate-keys.mjs:');
        console.log(`
import webpush from 'web-push';
const vapidKeys = webpush.generateVAPIDKeys();
console.log('NUEVAS CLAVES VAPID:');
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
        `);
    }
}