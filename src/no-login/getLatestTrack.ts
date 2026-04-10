import { resolve } from 'path'
import dotenv from 'dotenv'
import { fetchRecentlyPlayed, parseLastFmTrack } from '../lastfm.js'
import { findAndReplace } from '../utils.js'

dotenv.config()

const readmeFile = resolve(import.meta.dirname, '../../README.template.md')

const apiKey = process.env.LASTFM_API_KEY
const username = process.env.LASTFM_USERNAME

const main = async () => {
  if (!apiKey || !username) {
    console.error('Missing LASTFM_API_KEY or LASTFM_USERNAME!')
    process.exit(1)
  }

  const track = await fetchRecentlyPlayed(apiKey, username)
  const parsedTrack = await parseLastFmTrack(track, apiKey)

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

main()
