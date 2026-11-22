import { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import type { Database } from '../types/supabase';

type Customer = Database['public']['Tables']['customers']['Row'];

interface CustomerMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onMerge: (keepId: string, deleteId: string, mergedData: Partial<Customer>) => Promise<boolean>;
}

export function CustomerMergeModal({
  isOpen,
  onClose,
  customers,
  onMerge,
}: CustomerMergeModalProps) {
  const [customer1, customer2] = customers;
  const [mergedName, setMergedName] = useState('');
  const [mergedPhone, setMergedPhone] = useState('');
  const [mergedEmail, setMergedEmail] = useState('');
  const [mergedAddresses, setMergedAddresses] = useState<string[]>([]);
  const [mergedNotes, setMergedNotes] = useState('');
  const [keepCustomerId, setKeepCustomerId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customers.length === 2) {
      const longerName = customer1.name.length >= customer2.name.length
        ? customer1.name
        : customer2.name;
      setMergedName(longerName);

      setMergedPhone(customer1.phone);
      setMergedEmail(customer1.email);

      const allAddresses = [
        ...(customer1.addresses || []),
        ...(customer2.addresses || []),
      ];
      const uniqueAddresses = [...new Set(
        allAddresses.map(a => a.trim()).filter(a => a.length > 0)
      )];
      setMergedAddresses(uniqueAddresses);

      const notes = [customer1.notes, customer2.notes]
        .filter(Boolean)
        .join('\n---\n');
      setMergedNotes(notes);

      setKeepCustomerId(customer1.id);
    }
  }, [customers, customer1, customer2]);

  const handleSubmit = async () => {
    if (!keepCustomerId || customers.length !== 2) return;

    setIsSubmitting(true);
    const deleteId = keepCustomerId === customer1.id ? customer2.id : customer1.id;

    const success = await onMerge(keepCustomerId, deleteId, {
      name: mergedName,
      phone: mergedPhone,
      email: mergedEmail,
      addresses: mergedAddresses,
      notes: mergedNotes || null,
    });

    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  const removeAddress = (index: number) => {
    setMergedAddresses(prev => prev.filter((_, i) => i !== index));
  };

  const addAddress = () => {
    setMergedAddresses(prev => [...prev, '']);
  };

  const updateAddress = (index: number, value: string) => {
    setMergedAddresses(prev => prev.map((addr, i) => i === index ? value : addr));
  };

  if (customers.length !== 2) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mesclar Clientes" size="xl">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              keepCustomerId === customer1.id
                ? 'border-accent bg-accent/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setKeepCustomerId(customer1.id)}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                keepCustomerId === customer1.id ? 'border-accent' : 'border-gray-300'
              }`}>
                {keepCustomerId === customer1.id && (
                  <div className="w-2 h-2 rounded-full bg-accent" />
                )}
              </div>
              <span className="text-sm font-medium text-gray-500">Cliente 1</span>
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">{customer1.name}</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p className="flex items-center gap-2">
                <i className="fas fa-phone text-xs text-gray-400"></i>
                {customer1.phone}
              </p>
              <p className="flex items-center gap-2">
                <i className="fas fa-envelope text-xs text-gray-400"></i>
                {customer1.email}
              </p>
              {customer1.addresses?.map((addr, i) => (
                <p key={i} className="flex items-start gap-2">
                  <i className="fas fa-location-dot text-xs text-gray-400 mt-1"></i>
                  {addr}
                </p>
              ))}
            </div>
          </div>

          <div
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              keepCustomerId === customer2.id
                ? 'border-accent bg-accent/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setKeepCustomerId(customer2.id)}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                keepCustomerId === customer2.id ? 'border-accent' : 'border-gray-300'
              }`}>
                {keepCustomerId === customer2.id && (
                  <div className="w-2 h-2 rounded-full bg-accent" />
                )}
              </div>
              <span className="text-sm font-medium text-gray-500">Cliente 2</span>
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">{customer2.name}</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p className="flex items-center gap-2">
                <i className="fas fa-phone text-xs text-gray-400"></i>
                {customer2.phone}
              </p>
              <p className="flex items-center gap-2">
                <i className="fas fa-envelope text-xs text-gray-400"></i>
                {customer2.email}
              </p>
              {customer2.addresses?.map((addr, i) => (
                <p key={i} className="flex items-start gap-2">
                  <i className="fas fa-location-dot text-xs text-gray-400 mt-1"></i>
                  {addr}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <i className="fas fa-code-merge text-accent"></i>
            Resultado da Mesclagem
          </h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={mergedName}
                onChange={(e) => setMergedName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 focus:border-gray-400 focus:outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="text"
                  value={mergedPhone}
                  onChange={(e) => setMergedPhone(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 focus:border-gray-400 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={mergedEmail}
                  onChange={(e) => setMergedEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 focus:border-gray-400 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereços</label>
              <div className="space-y-2">
                {mergedAddresses.map((addr, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={addr}
                      onChange={(e) => updateAddress(index, e.target.value)}
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 focus:border-gray-400 focus:outline-none transition-colors"
                      placeholder="Endereço"
                    />
                    <button
                      type="button"
                      onClick={() => removeAddress(index)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-accent"
                    >
                      <i className="fas fa-trash text-sm"></i>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addAddress}
                  className="w-full py-2 px-4 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-accent hover:text-accent transition-colors"
                >
                  <i className="fas fa-plus-circle mr-2"></i>
                  Adicionar endereço
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea
                value={mergedNotes}
                onChange={(e) => setMergedNotes(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 focus:border-gray-400 focus:outline-none transition-colors"
                rows={3}
                placeholder="Notas sobre o cliente..."
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !mergedName.trim()}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                A mesclar...
              </>
            ) : (
              <>
                <i className="fas fa-code-merge mr-2"></i>
                Mesclar Clientes
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
