#!/usr/bin/env ts-node
/// <reference types="spotify-api" />
import { resolve } from 'path'
import fetch from 'cross-fetch'
import dotenv from 'dotenv'
import { parseTrack, findAndReplace } from '../utils'

dotenv.config()

const readmeFile = resolve(__dirname, '../../README.template.md')

const main = async () => {
  const baseUri = process.env.BASE_URI
  const response = await fetch(`${baseUri}/recently-played`)

  if (response.ok) {
    const recentlyPlayed: SpotifyApi.UsersRecentlyPlayedTracksResponse = (
      await response.json()
    ).body

    const [firstTrack] = recentlyPlayed.items

    const parsedTrack = parseTrack(firstTrack)

    const [{ hasChanged }] = await findAndReplace(parsedTrack, {
      files: [readmeFile],
    })

    if (hasChanged) {
      const killed = await fetch(`${baseUri}/kill`)

      if (!killed.ok) {
        console.error('ERROR: Failed to kill')
      }
    } else {
      console.log('ERROR: No changes were made')
    }
  } else {
    console.error(`ERROR: ${response.status} ${response.statusText}`)
  }
}

export default main

if (require.main === module) {
  main()
}
