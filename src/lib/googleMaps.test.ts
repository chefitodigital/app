import { describe, expect, it } from 'vitest';
import { googleMapsUrl } from './googleMaps';

describe('link do Google Maps', () => {
  it('aceita links comuns de compartilhamento', () => {
    expect(googleMapsUrl('https://maps.app.goo.gl/exemplo')).toBe('https://maps.app.goo.gl/exemplo');
    expect(googleMapsUrl('https://www.google.com/maps/place/Loja')).toBe('https://www.google.com/maps/place/Loja');
    expect(googleMapsUrl('https://goo.gl/maps/exemplo')).toBe('https://goo.gl/maps/exemplo');
  });
  it('rejeita endereços inseguros ou que imitam o Google', () => {
    expect(googleMapsUrl('javascript:alert(1)')).toBeNull();
    expect(googleMapsUrl('https://maps.app.goo.gl.exemplo.com/a')).toBeNull();
    expect(googleMapsUrl('https://google.com/outro')).toBeNull();
    expect(googleMapsUrl('')).toBeNull();
  });
});
