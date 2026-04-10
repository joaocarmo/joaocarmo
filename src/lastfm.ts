import type { ParsedTrack } from './types.js'

const BASE_URL = 'https://ws.audioscrobbler.com/2.0'
const imagePlaceholder = 'https://via.placeholder.com/100'

interface LastFmImage {
  size: string
  '#text': string
}

interface LastFmTrack {
  name: string
  artist: { '#text': string }
  album: { '#text': string }
  image: LastFmImage[]
}

interface LastFmAlbumInfo {
  album?: {
    wiki?: {
      published?: string
    }
  }
}

interface RecentTracksResponse {
  recenttracks: {
    track: LastFmTrack[]
  }
}

const buildUrl = (params: Record<string, string>): string => {
  const searchParams = new URLSearchParams({
    ...params,
    format: 'json',
  })

  return `${BASE_URL}?${searchParams.toString()}`
}

export const fetchRecentlyPlayed = async (
  apiKey: string,
  username: string,
): Promise<LastFmTrack> => {
  const url = buildUrl({
    method: 'user.getrecenttracks',
    user: username,
    api_key: apiKey,
    limit: '1',
  })

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(
      `Last.fm API error: ${response.status} ${response.statusText}`,
    )
  }

  const data = (await response.json()) as RecentTracksResponse
  const [firstTrack] = data.recenttracks.track

  if (!firstTrack) {
    throw new Error('No recently played tracks found')
  }

  return firstTrack
}

export const fetchAlbumReleaseYear = async (
  apiKey: string,
  artist: string,
  album: string,
): Promise<string> => {
  const url = buildUrl({
    method: 'album.getinfo',
    api_key: apiKey,
    artist,
    album,
  })

  const response = await fetch(url)

  if (!response.ok) {
    return ''
  }

  const data = (await response.json()) as LastFmAlbumInfo
  const published = data.album?.wiki?.published

  if (!published) {
    return ''
  }

  // published is like "01 January 2020, 00:00" — extract the year
  const yearMatch = published.match(/\d{4}/)

  return yearMatch?.[0] ?? ''
}

const getAlbumImage = (images: LastFmImage[]): string => {
  const extralarge = images.find(({ size }) => size === 'extralarge')

  if (extralarge?.['#text']) {
    return extralarge['#text']
  }

  const large = images.find(({ size }) => size === 'large')

  return large?.['#text'] || imagePlaceholder
}

export const parseLastFmTrack = async (
  track: LastFmTrack,
  apiKey: string,
): Promise<ParsedTrack> => {
  const album = track.album['#text']
  const artist = track.artist['#text']
  const image = getAlbumImage(track.image)
  const title = track.name
  const released = await fetchAlbumReleaseYear(apiKey, artist, album)

  return { album, artist, image, released, title }
}
