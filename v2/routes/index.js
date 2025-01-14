const express = require('express')

const productsRouter = require('./products.router')
const inventoryRouter = require('./inventory.router')
const ordersRouter = require('./orders.router')
const suppliersRouter = require('./suppliers.router')
const categoriesRouter = require('./categories.router')

function routerApi(app) {
  const router = express.Router()

  app.use('/api/v2', router)
  router.use('/products', productsRouter)
  router.use('/inventory', inventoryRouter)
  router.use('/orders', ordersRouter)
  router.use('/suppliers', suppliersRouter)
  router.use('/categories', categoriesRouter)
}

module.exports = routerApi
