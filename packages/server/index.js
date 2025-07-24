import express from 'express'

const app = express()

app.get('/', (req, res) => {
  res.send('Hello, we are making locaid.')
})

app.listen(1210)