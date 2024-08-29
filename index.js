require('dotenv').config();
const express = require('express')
const cors = require('cors')
const routerApi = require('./routes')

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
  res.send("server de inventario funcionando.")
})

routerApi(app)

app.listen(PORT, () => {
  console.log('port' + PORT)
})
