const express = require('express');
const ProductService = require('../services/product.service');
const service = new ProductService;

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const products = await service.find();
    if (products) {
      res.status(200).json(products);
    } else {
      res.status(500).json({
        success: false,
        message: 'Ocurrió un error encontrar los productos.',
      });
    }

  } catch (error) {
    console.log(error);
  }
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
