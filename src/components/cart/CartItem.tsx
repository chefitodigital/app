import React, { useMemo } from 'react';
import { useThemeStore } from '../../store/theme';
import type { CartItem as CartItemType } from '../../store/cart';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

const CartItem = React.memo(function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const { formatCurrency } = useThemeStore();

  const itemTotal = useMemo(() =>
    (item.price + item.extras.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0)) * item.quantity,
    [item.price, item.extras, item.quantity]
  );

  return (
    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 group hover:bg-gray-100 transition-colors">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <h3 className="text-base sm:text-lg font-bold text-gray-800">{item.name}</h3>
        <button
          onClick={() => onRemove(item.id)}
          className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-500 hover:bg-gray-200 rounded-lg sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300"
        >
          <i className="fas fa-trash text-sm sm:text-lg"></i>
        </button>
      </div>

      {item.extras.length > 0 && (
        <div className="mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600">
          <p className="font-medium text-gray-700 mb-1">Extras:</p>
          <ul className="space-y-0.5 sm:space-y-1 ml-3 sm:ml-4">
            {item.extras.map((extra) => (
              <li key={extra.id} className="flex justify-between">
                <span>{extra.name} ({extra.quantity}x)</span>
                <span className="text-accent">
                  +{formatCurrency(extra.price * extra.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
          <button
            onClick={() => {
              if (item.quantity === 1) {
                onRemove(item.id);
              } else {
                onUpdateQuantity(item.id, item.quantity - 1);
              }
            }}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
          >
            <i className="fas fa-square-minus text-lg text-gray-600"></i>
          </button>
          <span className="w-8 text-center font-medium text-base">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
          >
            <i className="fas fa-square-plus text-lg text-gray-600"></i>
          </button>
        </div>
        <p className="text-base sm:text-lg font-bold text-accent">
          {formatCurrency(itemTotal)}
        </p>
      </div>
    </div>
  );
});

export default CartItem;
