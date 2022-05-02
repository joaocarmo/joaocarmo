const path = require('path')
const puppeteer = require('puppeteer')
require('dotenv').config()

const DEFAULT_USER_DATA_DIR = path.resolve(__dirname, '../profile')

const enviroment = process.env.ENVIRONMENT || 'production'
const isDev = enviroment === 'development'
const loginPage = process.env.LOGIN_PAGE
const username = process.env.SPOTIFY_USERNAME
const password = process.env.SPOTIFY_PASSWORD
const proxyServer = process.env.PROXY_SERVER

// CSS Selectors
const selectors = {
  loginPage: {
    username: '#login-username',
    password: '#login-password',
    loginButton: '#login-button',
  },
  authorizePage: {
    authorizeButton: '[data-testid="auth-accept"]',
  },
}

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
    console.log(`Loading ${page}...`)

    try {
      await this.page.goto(page)

      console.log(`Logging ${username} in...`)

      await this.page.waitForSelector(selectors.loginPage.username)
      await this.page.type(selectors.loginPage.username, username)
      await this.page.type(selectors.loginPage.password, password)
      await this.page.click(selectors.loginPage.loginButton)
      await this.page.waitForNavigation()
    } catch (error) {
      console.error(error)
    }
  }

  async authorize({ url }) {
    try {
      if (isDev) {
        console.log(`Loading ${url}...`)
      } else {
        console.log(`Authorizing...`)
      }

      await this.page.goto(url)
      await this.page.waitForSelector(selectors.authorizePage.authorizeButton)
      await this.page.click(selectors.authorizePage.authorizeButton)
      await this.page.waitForNavigation()
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
const loginAndAuthorize = async (authorizeURL) => {
  const browser = new Browser({
    userDataDir: DEFAULT_USER_DATA_DIR,
    headless: true,
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    args: [proxyServer && `--proxy-server=${proxyServer}`].filter(Boolean),
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
}

module.exports = { loginAndAuthorize }
