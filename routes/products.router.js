const express = require('express')

const ProductsService = require('./../services/product.service')

const service = new ProductsService

const router = express.Router()

router.get('/', async (req, res) => {
  const products = await service.getProducts()
  res.json(products)
})

module.exports = router
