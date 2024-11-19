const express = require('express');
const OrdersService = require('../services/orders.service');
const service = new OrdersService;

const router = express.Router();

router.get('/', async (req, res) => {
  res.json({message: "endpoint de pedidos."});
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
        message: 'Ocurrió un error al procesar el pedido.',
      });
    }
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
