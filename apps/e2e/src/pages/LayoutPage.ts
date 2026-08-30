import { By, until, type WebDriver } from 'selenium-webdriver';

export class LayoutPage {
  private driver: WebDriver;

  constructor(driver: WebDriver) {
    this.driver = driver;
  }

  async waitForAuthenticated(): Promise<void> {
    await this.driver.wait(until.elementLocated(By.css('.sidebar')), 8000);
  }

  async getNavLinks(): Promise<string[]> {
    const links = await this.driver.findElements(By.css('.nav-link'));
    const texts: string[] = [];
    for (const link of links) {
      texts.push(await link.getText());
    }
    return texts;
  }

  async clickNav(label: string): Promise<void> {
    const link = this.driver.findElement(
      By.xpath(`//nav[contains(@class,"sidebar-nav")]//a[contains(text(),"${label}")]`),
    );
    await link.click();
    await this.driver.sleep(500);
  }

  async getActiveNavLink(): Promise<string> {
    const active = this.driver.findElement(By.css('.nav-link.active'));
    return active.getText();
  }

  async getRoleLabel(): Promise<string> {
    const el = this.driver.findElement(By.css('.sidebar-role'));
    return el.getText();
  }

  async clickLogout(): Promise<void> {
    const btn = this.driver.findElement(By.css('.sidebar-footer .btn-sm'));
    await btn.click();
    await this.driver.wait(until.elementLocated(By.css('.login-card')), 5000);
  }

  async getLogoSrc(): Promise<string> {
    const img = this.driver.findElement(By.css('.servium-logo-sidebar'));
    return img.getAttribute('src');
  }

  async isSidebarVisible(): Promise<boolean> {
    try {
      const el = this.driver.findElement(By.css('.sidebar'));
      return el.isDisplayed();
    } catch {
      return false;
    }
  }

  async getCurrentUrl(): Promise<string> {
    return this.driver.getCurrentUrl();
  }

  async getPageTitle(): Promise<string> {
    return this.driver.getTitle();
  }
}
