#!/usr/bin/env ts-node
import { resolve } from 'path'
import SpotifyWebApi from 'spotify-web-api-node'
import dotenv from 'dotenv'
import { parseTrack, findAndReplace } from '../utils'

dotenv.config()

const readmeFile = resolve(__dirname, '../../README.template.md')

const enviroment = process.env.ENVIRONMENT || 'production'
const isDev = enviroment === 'development'
const accessToken = process.env.ACCESS_TOKEN
const refreshToken = process.env.REFRESH_TOKEN
const clientId = process.env.CLIENT_ID
const clientSecret = process.env.CLIENT_SECRET

const spotifyApi = new SpotifyWebApi({
  clientId,
  clientSecret,
})

const setAndRefreshToken = async () => {
  if (!accessToken || !refreshToken) {
    console.error('Missing access token or refresh token!')

    process.exit(1)
  }

  spotifyApi.setAccessToken(accessToken)
  spotifyApi.setRefreshToken(refreshToken)

  const {
    body: { access_token, refresh_token },
  } = await spotifyApi.refreshAccessToken()

  spotifyApi.setAccessToken(access_token)

  if (refresh_token) {
    spotifyApi.setRefreshToken(refresh_token)
  }

  if (isDev) {
    console.log('Access token:', access_token)
    console.log('Refresh token:', refresh_token)
  }
}

const main = async () => {
  await setAndRefreshToken()

  const recentlyPlayed = await spotifyApi.getMyRecentlyPlayedTracks({
    limit: 1,
  })

  const [firstTrack] = recentlyPlayed.body.items

  const parsedTrack = parseTrack(firstTrack)

  const [{ hasChanged }] = await findAndReplace(parsedTrack, {
    files: [readmeFile],
  })

  if (hasChanged) {
    console.log('Changes were made')
  } else {
    console.log('No changes were made')
  }

  process.exit(0)
}

export default main

if (require.main === module) {
  main()
}
