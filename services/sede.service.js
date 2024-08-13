const sedes = require('./sedes.list')

class SedeService {
  constructor () {
    this.sedes = sedes
  }

  find () {
    return this.sedes
  }
}

module.exports = SedeService
