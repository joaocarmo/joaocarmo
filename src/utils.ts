/// <reference types="spotify-api" />
import replace from 'replace-in-file'

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

export const parseTrack = ({
  track,
}: SpotifyApi.PlayHistoryObject): ParsedTrack => {
  const album = track.album.name
  const artist = track.artists.map(({ name }) => name).join(', ')
  const image =
    track.album.images.find(({ height }) => height && height <= 100)?.url ||
    imagePlaceholder
  const released = track.album.release_date.split('-')[0]
  const title = track.name

  return { album, artist, image, released, title }
}

export const findAndReplace = async (
  parsedTrack: ParsedTrack,
  options: FROptions,
) => {
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
