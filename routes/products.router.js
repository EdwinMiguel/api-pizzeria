const express = require('express');

const ProductsService = require('./../services/product.service');
const service = new ProductsService;

const router = express.Router()

router.get('/', async (req, res) => {
  const products = await service.find();
  res.json(products);
})

router.post('/', async (req, res) => {
  try {
    const body = req.body;
    const newProduct = await service.save(body);
    res.json(newProduct);
  } catch (error) {
    console.log(error);
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const product = await service.update(id, body);
    res.json(product);
  } catch (error) {
    console.log(error)
  }
})

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const rta = await service.delete(id);
  res.json(rta);
})

module.exports = router;
