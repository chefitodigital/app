import React from 'react';

export function ContactFirstOrder({ customerPhone }: { customerPhone: string }) {
  const handleContact = () => {
      const cleanNumber = customerPhone.replace(/\D/g, '');
      const message = encodeURIComponent('Olá! Obrigado pelo seu primeiro pedido com a gente! 🎉');
      const whatsappUrl = `https://wa.me/${cleanNumber}?text=${message}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return <button type="button" onClick={handleContact} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-accent/10 px-3 text-sm font-semibold text-accent transition-colors hover:bg-accent/20"><i className="fab fa-whatsapp text-base" aria-hidden="true" />Contatar cliente</button>;
}

export default function FirstOrderBadge() {
  return <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full"><i className="fas fa-star text-accent text-xs" aria-hidden="true" /><span className="text-sm font-semibold text-accent">Primeiro pedido</span></div>;
}
