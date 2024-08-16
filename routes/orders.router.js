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

router.post('/', async (req, res) => {
  const body = req.body;
  const newOrder = await service.create(body);
  res.json(newOrder);
});

module.exports = router;
