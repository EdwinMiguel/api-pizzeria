const express = require('express')

const productsRouter = require('./products.router')
const inventoryRouter = require('./inventory.router')

function routerApi(app) {
  const router = express.Router()

  app.use('/api/v2', router)
  router.use('/products', productsRouter)
  router.use('/inventory', inventoryRouter)
}

module.exports = routerApi
