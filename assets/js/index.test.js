import { Builder, By, Key, until } from 'selenium-webdriver'

it('should be able to login and visit the captains page', () => {
    jest.setTimeout(100000)
    const driver = new Builder().forBrowser('chrome').build()
    console.log('loading...')
    return driver.get('http://localhost:8000/')
      .then(() => {
          return driver.findElement(By.name('a')).click()
      }).then(() => {
          return driver.wait(until.elementLocated(By.className('bottom-nav')))
      }).then((nav) => {
          // Click the map tab
          return nav.findElements(By.className('button'))[2].click()
      }).then(() => {
          return driver.wait(until.urlContains('/map'))
      }).then(() => driver.quit()).catch((err) => {driver.quit();throw err})
})
