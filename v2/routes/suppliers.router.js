const express = require('express');
const SuppliersService = require('../services/suppliers.service');
const service = new SuppliersService;

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const suppliers = await service.find();
    if (suppliers) {
      res.status(200).json(suppliers);
    } else {
      res.status(500).json({
        success: false,
        message: 'Ocurrió un error encontrar los proveedores.',
      });
    }

  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
