import type { ServiceInfo } from '@servium/shared-types';

const serviceInfo: ServiceInfo = {
  name: 'ServiumAI',
  version: '0.1.0',
};

export function App() {
  return (
    <main>
      <h1>{serviceInfo.name}</h1>
      <p>Painel operacional — v{serviceInfo.version}</p>
    </main>
  );
}
