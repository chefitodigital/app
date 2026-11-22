import React from 'react';
import CartItem from './CartItem';
import type { CartItem as CartItemType } from '../../store/cart';

interface CartItemsProps {
  items: CartItemType[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export default function CartItems({ items, onUpdateQuantity, onRemove }: CartItemsProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-center">
            <i className="fas fa-basket-shopping text-5xl sm:text-6xl mb-4 opacity-50"></i>
            <p className="text-base sm:text-lg font-medium">Seu carrinho está vazio</p>
            <p className="text-xs sm:text-sm">Adicione alguns itens para continuar</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {items.map((item) => (
        <CartItem
          key={item.id}
          item={item}
          onUpdateQuantity={onUpdateQuantity}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
