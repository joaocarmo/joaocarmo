const path = require('path')
const puppeteer = require('puppeteer')
require('dotenv').config()

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
  constructor(initOptions) {
    this.browser = null
    this.page = null
    this.options = initOptions
  }

  async open(extraOptions) {
    try {
      this.browser = await puppeteer.launch({
        ...this.options,
        ...extraOptions,
      })

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

      const usernameElement = await this.page.waitForSelector(
        selectors.loginPage.username,
      )
      if (usernameElement) {
        await this.page.type(selectors.loginPage.username, username)
        await this.page.type(selectors.loginPage.password, password)
        await this.page.click(selectors.loginPage.loginButton)
        await this.page.waitForNavigation()
      } else {
        console.warn(`Selector not found: ${selectors.loginPage.username}`)
      }
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
      const authorizeElement = await this.page.waitForSelector(
        selectors.authorizePage.authorizeButton,
      )
      if (authorizeElement) {
        await this.page.click(selectors.authorizePage.authorizeButton)
        await this.page.waitForNavigation()
      } else {
        console.warn(
          `Selector not found: ${selectors.authorizePage.authorizeButton}`,
        )
      }
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
  const args = [proxyServer && `--proxy-server=${proxyServer}`].filter(Boolean)
  const browser = new Browser({
    headless: true,
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    args,
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
