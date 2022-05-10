#!/usr/bin/env node
const bodyParser = require('body-parser')
const cors = require('cors')
const express = require('express')
const opn = require('opn')
const SpotifyWebApi = require('spotify-web-api-node')
const { loginAndAuthorize } = require('./loginAndAuthorize')
const getLatestTrack = require('./getLatestTrack')
require('dotenv').config()

const app = express()
const router = express.Router()

const authorize = process.env.AUTHORIZE === 'true'
const clientId = process.env.CLIENT_ID
const clientSecret = process.env.CLIENT_SECRET
const enviroment = process.env.ENVIRONMENT || 'production'
const isDev = enviroment === 'development'
const redirectUri = process.env.REDIRECT_URI
const port = process.env.PORT || 3000

const scopes = ['user-read-recently-played']
const state = 'spotify_auth_state'

const spotifyApi = new SpotifyWebApi({
  clientId,
  clientSecret,
  redirectUri,
})

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cors())

router.get('/', (req, res) => {
  res.json({ message: 'Hello there !' })
})

router.get('/kill', (req, res) => {
  res.json({ message: 'Bye !' })
  process.exit(0)
})

router.get('/callback', async (req, res) => {
  const {
    query: { code },
  } = req

  try {
    const {
      body: { access_token, refresh_token },
    } = await spotifyApi.authorizationCodeGrant(code)

    if (isDev) {
      console.log(`ACCESS_TOKEN=${access_token}`)
      console.log(`REFRESH_TOKEN=${refresh_token}`)
    }

    spotifyApi.setAccessToken(access_token)
    spotifyApi.setRefreshToken(refresh_token)

    res.redirect('/recently-played')
  } catch (error) {
    console.error('authorizationCodeGrant', error)

    res.status(500).json({ error })
  }
})

router.get('/recently-played', async (req, res) => {
  try {
    const recentlyPlayed = await spotifyApi.getMyRecentlyPlayedTracks({
      limit: 1,
    })

    res.json(recentlyPlayed)
  } catch (error) {
    console.error('getMyRecentlyPlayedTracks', error)

    try {
      const {
        body: { access_token, refresh_token },
      } = await spotifyApi.refreshAccessToken()

      spotifyApi.setAccessToken(access_token)
      spotifyApi.setRefreshToken(refresh_token)

      res.redirect(req.originalUrl)
    } catch (error) {
      console.error('refreshAccessToken', error)

      res.status(500).json({ error })
    }
  }
})

app.use('/', router)

app.listen(port, async () => {
  const env = isDev ? 'development' : 'production'
  console.log(`[${env}] Server running on port ${port}...`)

  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state)

  if (authorize) {
    console.log('Opening browser...')

    opn(authorizeURL)
  } else {
    if (isDev) {
      console.log('Authorize URL:', authorizeURL)
    }

    const success = await loginAndAuthorize(authorizeURL)

    if (success) {
      await getLatestTrack()
    } else {
      console.error('Login and authorize failed!')
      process.exit(1)
    }
  }
})
