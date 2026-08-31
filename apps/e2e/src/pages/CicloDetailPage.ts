import { By, until, type WebDriver } from 'selenium-webdriver';

export class CicloDetailPage {
  private driver: WebDriver;

  constructor(driver: WebDriver) {
    this.driver = driver;
  }

  /** Abre o detalhe do ciclo clicando em "Detalhes" na linha da lista. */
  async openByRow(clienteNome: string, descricao: string): Promise<void> {
    const row = await this.driver.findElement(
      By.xpath(`//tr[td[text()="${clienteNome}"] and td[text()="${descricao}"]]`),
    );
    await row.findElement(By.linkText('Detalhes')).click();
    const h1 = await this.driver.wait(until.elementLocated(By.css('.page-header h1')), 8000);
    await this.driver.wait(until.elementTextContains(h1, `Ciclo de ${clienteNome} — ${descricao}`), 8000);
  }

  /** Cabeçalho em linguagem de negócio (sem UUID). */
  async heading(): Promise<string> {
    return this.driver.findElement(By.css('.page-header h1')).getText();
  }

  async hasSection(titulo: string): Promise<boolean> {
    try {
      await this.driver.wait(
        until.elementLocated(By.xpath(`//h2[normalize-space(.)="${titulo}"]`)),
        8000,
      );
      return true;
    } catch {
      return false;
    }
  }

  async hasError(): Promise<boolean> {
    return (await this.driver.findElements(By.css('.alert-error'))).length > 0;
  }

  async currentUrl(): Promise<string> {
    return this.driver.getCurrentUrl();
  }
}