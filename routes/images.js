// routes/images.js

import express from 'express';

const router = express.Router();

// Datos de imágenes de ejemplo
const images = [
  { 
    id: 1, 
    url: 'https://picsum.photos/300/200?random=1', 
    title: 'Imagen 1',
    description: 'Descripción de la imagen 1'
  },
  { 
    id: 2, 
    url: 'https://picsum.photos/300/200?random=2', 
    title: 'Imagen 2',
    description: 'Descripción de la imagen 2'
  },
  { 
    id: 3, 
    url: 'https://picsum.photos/300/200?random=3', 
    title: 'Imagen 3',
    description: 'Descripción de la imagen 3'
  },
  { 
    id: 4, 
    url: 'https://picsum.photos/300/200?random=4', 
    title: 'Imagen 4',
    description: 'Descripción de la imagen 4'
  },
  { 
    id: 5, 
    url: 'https://picsum.photos/300/200?random=5', 
    title: 'Imagen 5',
    description: 'Descripción de la imagen 5'
  },
  { 
    id: 6, 
    url: 'https://picsum.photos/300/200?random=6', 
    title: 'Imagen 6',
    description: 'Descripción de la imagen 6'
  }
];

// Obtener todas las imágenes
router.get('/', (req, res) => {
  console.log('🖼️ Solicitando imágenes');
  res.json(images);
});

// Obtener imagen por ID
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const image = images.find(img => img.id === id);
  
  if (image) {
    res.json(image);
  } else {
    res.status(404).json({
      error: 'Imagen no encontrada'
    });
  }
});

// Agregar nueva imagen (ejemplo para posts)
router.post('/', (req, res) => {
  const { title, url, description } = req.body;
  
  if (!title || !url) {
    return res.status(400).json({
      error: 'Title y URL son requeridos'
    });
  }
  
  const newImage = {
    id: images.length + 1,
    title,
    url,
    description: description || '',
    createdAt: new Date().toISOString()
  };
  
  images.push(newImage);
  
  res.status(201).json({
    success: true,
    image: newImage,
    message: 'Imagen agregada correctamente'
  });
});

export default router;