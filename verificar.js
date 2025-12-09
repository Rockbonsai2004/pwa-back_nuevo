// verificar.js
console.log('🔍 VERIFICANDO CONFIGURACIÓN...');
require('dotenv').config();

const frontendKey = 'BBOd5u6Uadgq1VmbNg1EzjDvJUwLFcIQSkV8PitNZa4G44CW1yhTrpEOFlpQAheA7evDwgJ_XPvEev1QklvAxhA';
const backendKey = process.env.VAPID_PUBLIC_KEY;

console.log('\n1. CLAVES ACTUALES:');
console.log('Frontend:', frontendKey.substring(0, 30) + '...');
console.log('Backend:', backendKey?.substring(0, 30) + '...');
console.log('¿Son iguales?', frontendKey === backendKey ? '✅ SÍ' : '❌ NO');

console.log('\n2. LONGITUDES:');
console.log('Frontend:', frontendKey.length, 'caracteres');
console.log('Backend:', backendKey?.length || 0, 'caracteres');

console.log('\n3. DIAGNÓSTICO:');
if (frontendKey !== backendKey) {
  console.log('❌ PROBLEMA: Claves diferentes');
  console.log('💡 SOLUCIÓN: Usar la MISMA clave en ambos lados');
} else {
  console.log('✅ CORRECTO: Claves iguales');
}