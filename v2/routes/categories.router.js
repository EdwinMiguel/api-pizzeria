const express = require('express');
const CategoriesService = require('../services/categories.service');
const service = new CategoriesService;

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const categories = await service.find();
    if (categories) {
      res.status(200).json(categories);
    } else {
      res.status(500).json({
        success: false,
        message: 'Ocurrió un error encontrar las categorias.',
      });
    }

  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
