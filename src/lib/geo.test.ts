import { describe, expect, it } from 'vitest';
import { calculateDeliveryFee, haversineDistance } from './geo';

describe('haversineDistance', () => {
  it('returns zero for the same coordinates', () => {
    const point = { lat: 41.1579, lng: -8.6291 };
    expect(haversineDistance(point, point)).toBe(0);
  });

  it('returns an approximate distance in kilometres', () => {
    const porto = { lat: 41.1579, lng: -8.6291 };
    const lisbon = { lat: 38.7223, lng: -9.1393 };
    expect(haversineDistance(porto, lisbon)).toBeGreaterThan(270);
    expect(haversineDistance(porto, lisbon)).toBeLessThan(280);
  });
});

describe('calculateDeliveryFee', () => {
  it('combines the base price with the per-kilometre price', () => {
    const restaurant = { lat: 41.1579, lng: -8.6291 };
    const customer = { lat: 41.1679, lng: -8.6291 };
    const fee = calculateDeliveryFee(restaurant, customer, 2.5, 1);

    expect(fee).toBeGreaterThan(3.5);
    expect(fee).toBeLessThan(3.7);
  });
});
