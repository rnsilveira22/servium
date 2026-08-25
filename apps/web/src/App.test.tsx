import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';

function Brand() {
  return <h1>ServiumAI</h1>;
}

describe('App', () => {
  it('renderiza identidade do produto', () => {
    const html = renderToString(<Brand />);
    expect(html).toContain('ServiumAI');
  });
});
