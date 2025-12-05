// routes/posts.js
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Obtener todos los posts
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Por ahora retornamos posts de ejemplo
    // Aquí integrarías con tu modelo de Post en MongoDB
    const posts = [
      {
        id: 1,
        title: 'Bienvenido a la PWA',
        content: 'Esta es una aplicación PWA completa con funcionalidades offline.',
        author: 'Sistema',
        timestamp: new Date().toISOString(),
        likes: 5
      }
    ];

    res.json({
      success: true,
      posts,
      total: posts.length
    });
  } catch (error) {
    console.error('❌ Error obteniendo posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo posts'
    });
  }
});

// Crear nuevo post
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content, image } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Título y contenido son requeridos'
      });
    }

    // Aquí guardarías en MongoDB
    const newPost = {
      id: Date.now(), // En producción usarías MongoDB _id
      title,
      content,
      image: image || null,
      author: req.user.username,
      authorId: req.user._id,
      timestamp: new Date().toISOString(),
      status: 'published',
      likes: 0
    };

    console.log('📝 Nuevo post creado:', newPost);

    res.status(201).json({
      success: true,
      message: 'Post creado exitosamente',
      post: newPost
    });

  } catch (error) {
    console.error('❌ Error creando post:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando post'
    });
  }
});

// Obtener post por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Aquí buscarías en MongoDB
    const post = {
      id: parseInt(id),
      title: 'Post de ejemplo',
      content: 'Este es un post de ejemplo',
      author: 'Sistema',
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      post
    });
  } catch (error) {
    console.error('❌ Error obteniendo post:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo post'
    });
  }
});

export default router;