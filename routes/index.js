const express = require('express')

const productsRouter = require('./products.router')
const sedesRouter = require('./sedes.router')
const ordersRouter = require('./orders.router')

function routerApi(app) {
  const router = express.Router()

  app.use('/api/v1', router)
  router.use('/products', productsRouter)
  router.use('/sedes', sedesRouter)
  router.use('/orders', ordersRouter)
}

module.exports = routerApi
