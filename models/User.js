// models/User.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'El nombre de usuario es requerido'],
    unique: true,
    trim: true,
    minlength: [3, 'El nombre de usuario debe tener al menos 3 caracteres'],
    maxlength: [30, 'El nombre de usuario no puede tener más de 30 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingresa un email válido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  pushSubscriptions: [{
    endpoint: String,
    keys: {
      p256dh: String,
      auth: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Middleware para hashear la contraseña antes de guardar
userSchema.pre('save', async function(next) {
  // Solo hashear si la contraseña fue modificada
  if (!this.isModified('password')) return next();
  
  try {
    // Generar salt
    const salt = await bcrypt.genSalt(12);
    // Hashear la contraseña
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para obtener datos públicos del usuario (sin contraseña)
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.pushSubscriptions;
  return user;
};

// Método para agregar suscripción push
userSchema.methods.addPushSubscription = function(subscription) {
  // Evitar duplicados
  const exists = this.pushSubscriptions.some(
    sub => sub.endpoint === subscription.endpoint
  );
  
  if (!exists) {
    this.pushSubscriptions.push({
      endpoint: subscription.endpoint,
      keys: subscription.keys
    });
  }
  
  return this.save();
};

// Método para eliminar suscripción push
userSchema.methods.removePushSubscription = function(endpoint) {
  this.pushSubscriptions = this.pushSubscriptions.filter(
    sub => sub.endpoint !== endpoint
  );
  
  return this.save();
};

export default mongoose.model('User', userSchema);