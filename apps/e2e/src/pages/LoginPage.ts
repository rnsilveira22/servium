import { By, until, type WebDriver } from 'selenium-webdriver';
import { ENV } from '../config/env.js';
import { takeScreenshot, dumpState } from '../support/evidence.js';

export class LoginPage {
  private driver: WebDriver;

  constructor(driver: WebDriver) {
    this.driver = driver;
  }

  async open(): Promise<void> {
    await this.driver.get(`${ENV.WEB_URL}/login`);
    await this.driver.wait(until.elementLocated(By.css('.login-card')), 5000);
  }

  async fillSlug(slug: string): Promise<void> {
    const input = this.driver.findElement(
      By.xpath('//span[contains(text(),"Escritorio")]/ancestor::label/input'),
    );
    await input.clear();
    await input.sendKeys(slug);
  }

  async fillEmail(email: string): Promise<void> {
    const input = this.driver.findElement(By.css('input[type="email"]'));
    await input.clear();
    await input.sendKeys(email);
  }

  async fillPassword(password: string): Promise<void> {
    const input = this.driver.findElement(By.css('input[type="password"]'));
    await input.clear();
    await input.sendKeys(password);
  }

  async submit(): Promise<void> {
    const btn = this.driver.findElement(By.css('button[type="submit"]'));
    await btn.click();
  }

  async loginAs(slug: string, email: string, password: string): Promise<void> {
    await this.fillSlug(slug);
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  async loginAsAuthed(slug: string, email: string, password: string, attempts = 3): Promise<void> {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      await this.open();
      await this.loginAs(slug, email, password);
      const outcome = await this.pollOutcome(12000);
      if (outcome === 'sidebar') return;
      await this.driver.get('about:blank');
    }
    await takeScreenshot(this.driver, `login-falhou-${slug}-${Date.now()}`);
    const dump = await dumpState(this.driver, `login-falhou-${slug}-${Date.now()}`);
    throw new Error(
      `Login falhou após ${attempts} tentativa(s): url=${await this.driver.getCurrentUrl()}; ` +
        `erro=${await this.getErrorMessage()}; dump=${dump}`,
    );
  }

  async pollOutcome(timeoutMs: number): Promise<'sidebar' | 'error' | 'timeout'> {
    try {
      await this.driver.wait(until.elementLocated(By.css('.sidebar')), timeoutMs);
      return 'sidebar';
    } catch {
      /* não autenticou — segue */
    }
    try {
      await this.driver.wait(until.elementLocated(By.css('.alert-error')), timeoutMs);
      return 'error';
    } catch {
      /* sem erro exibido */
    }
    return 'timeout';
  }

  async isDashboard(): Promise<boolean> {
    try {
      const el = this.driver.findElement(By.css('.sidebar'));
      return await el.isDisplayed();
    } catch {
      return false;
    }
  }

  async getErrorMessage(): Promise<string | null> {
    try {
      const el = this.driver.findElement(By.css('.alert-error'));
      return el.getText();
    } catch {
      return null;
    }
  }

  async isDisplayed(): Promise<boolean> {
    try {
      const el = this.driver.findElement(By.css('.login-card'));
      return el.isDisplayed();
    } catch {
      return false;
    }
  }

  async getLogoSrc(): Promise<string> {
    const img = this.driver.findElement(By.css('.servium-logo-login'));
    return img.getAttribute('src');
  }

  async getLogoAlt(): Promise<string> {
    const img = this.driver.findElement(By.css('.servium-logo-login'));
    return img.getAttribute('alt');
  }
}
