const path = require('path')
const puppeteer = require('puppeteer')
require('dotenv').config()

const DEFAULT_USER_DATA_DIR = path.resolve(__dirname, '../profile')

const enviroment = process.env.ENVIRONMENT || 'production'
const isDev = enviroment === 'development'
const loginPage = process.env.LOGIN_PAGE
const username = process.env.SPOTIFY_USERNAME
const password = process.env.SPOTIFY_PASSWORD

class Browser {
  constructor() {
    this.browser = null
    this.page = null
  }

  async open(options) {
    try {
      this.browser = await puppeteer.launch(options)

      this.page = await this.browser.newPage()

      await this.page.setViewport({
        width: 1366,
        height: 768,
      })

      this.page.setDefaultNavigationTimeout(10000) // 10s
    } catch (error) {
      console.error(error)
    }
  }

  async close() {
    try {
      await this.page.close()

      await this.browser.close()
    } catch (error) {
      console.error(error)
    }
  }

  async login({ page, username, password }) {
    try {
      console.log(`Loading ${page}...`)

      await this.page.goto(page)

      console.log(`Logging ${username} in...`)

      await this.page.type('#login-username', username)
      await this.page.type('#login-password', password)
      await this.page.click('#login-button')
      await this.wait()
    } catch (error) {
      console.error(error)
    }
  }

  async authorize({ url }) {
    try {
      if (isDev) {
        console.log(`Loading ${url}...`)
      }

      await this.page.goto(url)
      await this.wait()
    } catch (error) {
      console.error(error)
    }
  }

  async wait(options) {
    try {
      await this.page.waitForNavigation({
        waitUntil: 'networkidle2',
        ...options,
      })
    } catch (error) {
      console.error(error)
    }
  }
}

/**
 * Login and authorize Spotify
 * @async
 * @param {string} authorizeURL
 * @returns {Promise<void>}
 */
const loginAndAuthorize = async (authorizeURL, callback) => {
  const browser = new Browser({
    userDataDir: DEFAULT_USER_DATA_DIR,
    headless: true,
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
  })

  await browser.open()

  await browser.login({
    page: loginPage,
    username,
    password,
  })

  await browser.authorize({
    url: authorizeURL,
  })

  await browser.close()

  if (typeof callback === 'function') {
    callback()
  }
}

module.exports = { loginAndAuthorize }
