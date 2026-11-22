import React from 'react';
import { motion } from 'motion/react';

interface CartButtonProps {
  itemCount: number;
  onClick: () => void;
}

export default function CartButton({ itemCount, onClick }: CartButtonProps) {
  return (
    <div className="fixed bottom-8 right-8 z-50">
      <div className="relative w-[72px] h-[72px]">
        <motion.button
          onClick={onClick}
          initial={false}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
          className="relative w-[72px] h-[72px] flex items-center justify-center bg-accent text-gray-50 rounded-full shadow-card"
          aria-label={`Abrir carrinho${itemCount ? `, ${itemCount} itens` : ''}`}
        >
          <i className="fas fa-basket-shopping text-2xl"></i>
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-500 text-sm font-bold rounded-full backdrop-blur-sm">
              {itemCount}
            </span>
          )}
        </motion.button>
      </div>
    </div>
  );
}
