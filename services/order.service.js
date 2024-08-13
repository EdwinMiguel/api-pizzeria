const products = require("./products.list")

class OrderService {
  constructor () {
    this.orders = []
  }

  find () {
    return this.orders
  }

  async create (data) {
    const now = new Date()
    const day = now.getDate()
    const month = now.getMonth() + 1
    const year = now.getFullYear()
    const hour = now.getHours()
    const minutes = now.getMinutes()
    const seconds = now.getSeconds()
    const newOrder = {
      date: `${day}/${month}/${year} ${hour}:${minutes}:${seconds}`,
      ...data
    }

    this.orders.push(newOrder)
    return newOrder
  }
}

module.exports = OrderService
