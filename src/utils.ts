import { replaceInFile } from 'replace-in-file'
import type { ParsedTrack } from './types.js'

interface FROptions {
  files: string[]
}

export const findAndReplace = (
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
  const to = [artist, title, album, image, released ? ` [${released}]` : '']

  return replaceInFile({ ...options, from, to })
}
