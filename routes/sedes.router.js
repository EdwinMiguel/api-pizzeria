const express = require('express')

const SedeService = require('./../services/sede.service')
const service = new SedeService

const router = express.Router()

router.get('/', async (req, res) => {
  const sedesNames = await service.find()
  res.json(sedesNames)
})

module.exports = router
