import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { WebDriver } from 'selenium-webdriver';

const EVIDENCE_DIR = join(process.cwd(), 'evidence');

export async function takeScreenshot(driver: WebDriver, name: string): Promise<string> {
  await mkdir(EVIDENCE_DIR, { recursive: true });
  const path = join(EVIDENCE_DIR, `${name}.png`);
  const data = await driver.takeScreenshot();
  await writeFile(path, Buffer.from(data, 'base64'));
  return path;
}

export async function dumpState(driver: WebDriver, name: string): Promise<string> {
  await mkdir(EVIDENCE_DIR, { recursive: true });
  const state = await driver.executeScript(
    `return JSON.stringify({
      url: location.href,
      title: document.title,
      body: document.body ? document.body.innerText.slice(0, 500) : null,
      hasCard: !!document.querySelector('.login-card'),
      hasSidebar: !!document.querySelector('.sidebar'),
      hasError: !!document.querySelector('.alert-error'),
      errorText: document.querySelector('.alert-error')?.textContent ?? null,
      submit: document.querySelector('button[type="submit"]')?.textContent ?? null,
      inputs: Array.from(document.querySelectorAll('input')).map(i => ({ type: i.type, value: i.value })),
      cookies: document.cookie,
    })`,
  );
  const path = join(EVIDENCE_DIR, `${name}.json`);
  await writeFile(path, String(state));
  return path;
}
