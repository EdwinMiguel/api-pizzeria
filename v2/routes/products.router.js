const express = require('express');
const ProductService = require('../services/product.service');
const service = new ProductService;

const router = express.Router()

router.get('/', async (req, res) => {
  res.json({ message: 'Lista de órdenes en versión 2' });
});

router.post('/', async (req, res) => {
  try {
    const body = req.body;
    const result = await service.create(body);
    if (result && result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json({
        success: false,
        message: 'Ocurrió un error al guardar los datos.',
      });
    }
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
