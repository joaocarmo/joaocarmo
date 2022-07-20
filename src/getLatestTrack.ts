#!/usr/bin/env ts-node
/// <reference types="spotify-api" />
import fetch from 'cross-fetch'
import { resolve } from 'path'
import replace from 'replace-in-file'
import dotenv from 'dotenv'

dotenv.config()

const readmeFile = resolve(__dirname, '../README.template.md')
const imagePlaceholder = 'https://via.placeholder.com/100'

interface ParsedTrack {
  album: string
  artist: string
  image: string
  released: string
  title: string
}

interface FROptions {
  files: string[]
}

const parseTrack = ({ track }: SpotifyApi.PlayHistoryObject): ParsedTrack => {
  const album = track.album.name
  const artist = track.artists.map(({ name }) => name).join(', ')
  const image =
    track.album.images.find(({ height }) => height && height <= 100)?.url ||
    imagePlaceholder
  const released = track.album.release_date.split('-')[0]
  const title = track.name

  return { album, artist, image, released, title }
}

const findAndReplace = async (parsedTrack: ParsedTrack, options: FROptions) => {
  const { artist, title, album, image, released } = parsedTrack
  const from = [
    '{{artist}}',
    '{{title}}',
    '{{album}}',
    '{{image}}',
    '{{released}}',
  ]
  const to = [artist, title, album, image, released]

  return replace.sync({ ...options, from, to })
}

const main = async () => {
  const baseUri = process.env.BASE_URI
  const response = await fetch(`${baseUri}/recently-played`)

  if (response.ok) {
    const recentlyPlayed: SpotifyApi.UsersRecentlyPlayedTracksResponse = (
      await response.json()
    ).body

    const firstTrack = recentlyPlayed.items[0]

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
