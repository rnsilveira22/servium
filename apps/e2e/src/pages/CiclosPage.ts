import { By, until, type WebDriver } from 'selenium-webdriver';
import { ENV } from '../config/env.js';

export class CiclosPage {
  private driver: WebDriver;

  constructor(driver: WebDriver) {
    this.driver = driver;
  }

  async open(): Promise<void> {
    await this.driver.get(`${ENV.WEB_URL}/ciclos`);
    await this.driver.wait(until.elementLocated(By.css('.page-header h1')), 8000);
  }

  /** Uma linha do ciclo exibe cliente + obrigação legíveis (sem UUID visível). */
  async hasCiclo(clienteNome: string, descricao: string): Promise<boolean> {
    try {
      await this.driver.wait(
        until.elementLocated(
          By.xpath(
            `//td[text()="${clienteNome}"]/following-sibling::td[text()="${descricao}"]`,
          ),
        ),
        8000,
      );
      return true;
    } catch {
      return false;
    }
  }
}