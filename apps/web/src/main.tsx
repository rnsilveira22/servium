import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/brand-tokens.css';
import './App.css';

const container = document.getElementById('root');
if (!container) throw new Error('Elemento raiz nao encontrado');
createRoot(container).render(<App />);
