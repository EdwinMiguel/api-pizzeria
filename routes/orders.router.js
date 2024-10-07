const express = require('express');

const OrderService = require('../services/order.service');
const service = new OrderService;

const router = express.Router();

router.get('/', async (req, res) => {
    const orders = await service.find();

    if (orders.length === 0) {
     res.send("Aún no hay pedidos.");
    } else {
     res.json(orders);
    }

});

router.get('/options', async (req, res) => {
  const optionsList = await service.getOrderOptions();

  if (optionsList.length === 0) {
    res.send("No se encotraron las opciones de pedido.");
  } else {
    res.json(optionsList);
  }
});

router.post('/', async (req, res) => {
  const body = req.body;

  try {
    await service.appendOrder(body);
    res.status(200).send('Pedido recibido y resgistrado en Google Sheets.');
  } catch (error) {
    res.status(500).send('Error al registrar el pedido');
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const id = req.params;
    const body = req.body;
    const orderUpdated = await service.updateState(id, body);
    res.json(orderUpdated);
  } catch (error) {
    res.status(500).json('Error al cambiar estado del pedido');
  }
});

module.exports = router;
