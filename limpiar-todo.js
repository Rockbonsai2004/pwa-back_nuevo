import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function limpiar() {
  console.log('🧹 LIMPIANDO TODO PARA NUEVO INICIO...');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // 1. Eliminar todas las suscripciones
    await User.updateMany({}, { $set: { pushSubscriptions: [] } });
    console.log('✅ Suscripciones eliminadas');
    
    // 2. Contar usuarios afectados
    const count = await User.countDocuments({});
    console.log(`👥 ${count} usuarios listos para re-suscribirse`);
    
    await mongoose.disconnect();
    
    console.log('\n🎉 ¡LISTO! Ahora:');
    console.log('1. Actualiza las claves VAPID');
    console.log('2. Los usuarios deben permitir notificaciones de nuevo');
    console.log('3. ¡Funcionará!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

limpiar();