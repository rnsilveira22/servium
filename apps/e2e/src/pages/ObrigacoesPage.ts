import { By, until, type WebDriver } from 'selenium-webdriver';
import { ENV } from '../config/env.js';

export class ObrigacoesPage {
  private driver: WebDriver;

  constructor(driver: WebDriver) {
    this.driver = driver;
  }

  async open(): Promise<void> {
    await this.driver.get(`${ENV.WEB_URL}/obrigacoes`);
    await this.driver.wait(until.elementLocated(By.css('.page-header h1')), 8000);
  }

  async waitForClienteOption(clienteNome: string): Promise<void> {
    await this.driver.wait(
      until.elementLocated(By.xpath(`//label[.//span[text()="Cliente"]]/select/option[contains(text(),"${clienteNome}")]`)),
      8000,
    );
  }

  async clickNovaObrigacao(): Promise<void> {
    const btn = this.driver.findElement(By.xpath('//button[contains(text(),"+ Nova Obrigacao")]'));
    await btn.click();
    await this.driver.wait(until.elementLocated(By.css('form.form-inline')), 5000);
  }

  async selectCliente(clienteNome: string): Promise<void> {
    const select = this.driver.findElement(By.xpath('//label[.//span[text()="Cliente"]]/select'));
    const option = select.findElement(By.xpath(`.//option[contains(text(),"${clienteNome}")]`));
    await option.click();
  }

  async fillDescricao(descricao: string): Promise<void> {
    const input = this.driver.findElement(By.xpath('//label[.//span[text()="Descricao"]]/input'));
    await input.sendKeys(descricao);
  }

  async submit(): Promise<void> {
    const btn = this.driver.findElement(By.xpath('//form[contains(@class,"form-inline")]//button[@type="submit"]'));
    await btn.click();
  }

  async waitingRow(descricao: string): Promise<void> {
    await this.driver.wait(
      until.elementLocated(By.xpath(`//td[text()="${descricao}"]`)),
      8000,
    );
  }

  async activateCicloOnRow(descricao: string): Promise<void> {
    const btn = this.driver.findElement(
      By.xpath(
        `//td[text()="${descricao}"]/ancestor::tr//button[contains(text(),"Ativar ciclo")]`,
      ),
    );
    await btn.click();
  }

  async getSuccessMessage(): Promise<string> {
    const el = await this.driver.wait(until.elementLocated(By.css('.alert-success')), 8000);
    return el.getText();
  }
}