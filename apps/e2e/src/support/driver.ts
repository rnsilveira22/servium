import { createRequire } from 'node:module';
import { Builder, type WebDriver } from 'selenium-webdriver';
import { ENV } from '../config/env.js';

const require = createRequire(import.meta.url);

export async function createDriver(): Promise<WebDriver> {
  const chrome = require('selenium-webdriver/chrome');
  const chromedriver = require('chromedriver');

  const options = new chrome.Options();
  if (ENV.HEADLESS) {
    options.addArguments('--headless=new');
  }
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--disable-gpu');
  options.addArguments('--window-size=1280,720');
  options.addArguments('--disable-features=VizDisplayCompositor');

  const service = new chrome.ServiceBuilder(chromedriver.path);

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .setChromeService(service)
    .build();

  return driver;
}
