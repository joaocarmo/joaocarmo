#!/usr/bin/env node
const path = require('path')
const fetch = require('cross-fetch')
const replace = require('replace-in-file')
require('dotenv').config()

const readmeFile = path.resolve(__dirname, '../README.md')

/**
 * @typedef { import('spotify-web-api-node').SpotifyWebApi } SpotifyWebApi
 * @typedef { { artist: string, title: string, album: string, image: string } } ParsedTrack
 */

/**
 * @param {SpotifyApi.PlayHistoryObject} playHistory
 * @returns {ParsedTrack}
 */
const parseTrack = ({ track }) => {
  const album = track.album.name
  const artist = track.artists.map(({ name }) => name).join(', ')
  const image = track.album.images.find(({ height }) => height <= 100).url
  const released = track.album.release_date.split('-')[0]
  const title = track.name

  return { album, artist, image, released, title }
}

const findAndReplace = async (parsedTrack, options) => {
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
    /**
     * @type {SpotifyApi.UsersRecentlyPlayedTracksResponse}
     */
    const recentlyPlayed = await response.json()

    const firstTrack = recentlyPlayed.body.items[0]

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

if (require.main === module) {
  main()
} else {
  module.exports = main
}
