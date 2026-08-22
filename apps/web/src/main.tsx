import { createRoot } from 'react-dom/client';
import { App } from './App';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Elemento raiz não encontrado');
}

createRoot(container).render(<App />);
