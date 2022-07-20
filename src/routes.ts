import { Request, Response } from 'express'
import open from 'open'
import SpotifyWebApi from 'spotify-web-api-node'
import dotenv from 'dotenv'
import { loginAndAuthorize } from './loginAndAuthorize'
import getLatestTrack from './getLatestTrack'

dotenv.config()

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

export const handleStart = async () => {
  const env = isDev ? 'development' : 'production'
  console.log(`[${env}] Server running on port ${port}...`)

  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state)

  if (authorize) {
    console.log('Opening browser...')

    open(authorizeURL)
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
}

export const handleRoot = (req: Request, res: Response) => {
  res.json({ message: 'Hello there !' })
}

export const handleKill = (req: Request, res: Response) => {
  res.json({ message: 'Bye !' })
  process.exit(0)
}

interface CallbackQuery {
  code: string
}

export const handleCallback = async (
  req: Request<{}, {}, {}, CallbackQuery>,
  res: Response,
) => {
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
}

export const handleRecentlyPlayed = async (req: Request, res: Response) => {
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

      if (refresh_token) {
        spotifyApi.setRefreshToken(refresh_token)
      }

      res.redirect(req.originalUrl)
    } catch (error) {
      console.error('refreshAccessToken', error)

      res.status(500).json({ error })
    }
  }
}
