const express = require('express');
const OrdersService = require('../services/orders.service');
const service = new OrdersService;

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const orders = await service.find();
    if (orders) {
      res.status(200).json(orders);
    } else {
      res.status(500).json({
        success: false,
        message: 'Ocurrió un error encontrar los pedidos.',
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
        message: 'Ocurrió un error al procesar el pedido.',
      });
    }
  } catch (error) {
    console.log(error);
  }
});


router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await service.updateStatus(id, status);

    if (updated && updated.success) {
      res.status(200).json(updated);
    } else {
      res.status(500).json({
        success: false,
        message: 'Ocurrió un error al actualizar el estado del pedido.',
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const id = req.params;
    const body = req.body;
    const updated = await service.update(id, body);
    if (updated && updated.success) {
      res.status(200).json(updated);
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
