#!/usr/bin/env ts-node
import bodyParser from 'body-parser'
import cors from 'cors'
import express, { Router } from 'express'
import dotenv from 'dotenv'
import {
  handleCallback,
  handleKill,
  handleRecentlyPlayed,
  handleRoot,
  handleStart,
} from './routes'

dotenv.config()

const port = process.env.PORT || 3000

const app = express()
const router = Router()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cors())

router.get('/', handleRoot)
router.get('/kill', handleKill)
router.get('/callback', handleCallback)
router.get('/recently-played', handleRecentlyPlayed)

app.use('/', router)

app.listen(port, handleStart)
