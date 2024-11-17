const express = require('express');
const InventoryService = require('../services/inventory.service');
const service = new InventoryService;

const router = express.Router()

router.get('/', async (req, res) => {
  res.json({message: "endpoint de inventario"});
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
        message: 'Ocurrió un error al guardar los datos en el inventario.',
      });
    }
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
