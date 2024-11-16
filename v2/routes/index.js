const express = require('express')

const productsRouter = require('./products.router')

function routerApi(app) {
  const router = express.Router()

  app.use('/api/v2', router)
  router.use('/products', productsRouter)
}

module.exports = routerApi
