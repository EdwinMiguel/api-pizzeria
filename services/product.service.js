const products = require('./products.list')

class ProductsService {
  constructor () {
    this.products = products
  }

  getProducts () {
    return this.products;
  }

  save (name) {

  }
}

module.exports = ProductsService
