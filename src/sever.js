import express from 'express'
import helmet from 'helmet'
import path from 'path'
import cors from 'cors'
import bodyParser from 'body-parser'
import api from './routes'

const app = express()
app.enable('trust', 'proxy')
app.use(cors({ exposedHeaders: '*' }))
app.use(helmet())
app.use(bodyParser.json({ limit: '20mb' }))
app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }))
app.use('/api', api.router)
app.use('/', (req, res) => {
    res.status(200).json({ success: true, message: 'Health Check OK!' })
})
app.use(function (req, res) {
    res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT;

app.listen(PORT || 8082)