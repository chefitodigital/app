import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCustomers, CustomerWithTotalSpent } from '../hooks/useCustomers';
import { useThemeStore } from '../store/theme';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Button } from '../components/ui/Button';
import { CustomerMergeModal } from '../components/CustomerMergeModal';
import type { Database } from '../types/supabase';

type Customer = Database['public']['Tables']['customers']['Row'];
type SortMode = 'alphabetical' | 'totalSpent';

const isValidAddress = (address: string): boolean => {
  const trimmed = address.trim();
  if (!trimmed) return false;
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) return false;
  if (/^\d{1,2}h\d{0,2}$/i.test(trimmed)) return false;
  if (trimmed.length < 5) return false;
  return true;
};

interface CustomerCardProps {
  customer: CustomerWithTotalSpent;
  hasDuplicate: boolean;
  formatCurrency: (value: number) => string;
  onEdit: (customer: CustomerWithTotalSpent) => void;
  onDelete: (id: string) => void;
  onMerge: (customer: CustomerWithTotalSpent) => void;
  onReview: (customer: CustomerWithTotalSpent) => void;
}

function CustomerCard({ customer, hasDuplicate, formatCurrency, onEdit, onDelete, onMerge, onReview }: CustomerCardProps) {
  const [showAddressesModal, setShowAddressesModal] = useState(false);
  const validAddresses = useMemo(() => (customer.addresses || []).filter(isValidAddress), [customer.addresses]);

  return (
    <>
      <Card padding="none" className="overflow-hidden transition-shadow duration-300 hover:shadow-card-hover">
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-lg font-bold text-gray-800 font-title truncate">
                  {customer.name}
                </h3>
                {hasDuplicate && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full">
                    Duplicado
                  </span>
                )}
                {customer.needs_review && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-accent/10 text-accent rounded-full">
                    Revisar nomes
                  </span>
                )}
              </div>
              <div className="space-y-1 text-sm text-gray-500">
                <p className="flex items-center gap-2">
                  <i className="fas fa-phone text-xs text-gray-400 w-4"></i>
                  {customer.phone}
                </p>
                <p className="flex items-center gap-2 truncate">
                  <i className="fas fa-envelope text-xs text-gray-400 w-4"></i>
                  {customer.email}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Total gasto</p>
              <p className="text-lg font-bold text-accent">{formatCurrency(customer.totalSpent)}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Endereço {validAddresses.length > 1 ? `(${validAddresses.length})` : ''}
              </p>
              {validAddresses.length > 1 && (
                <button
                  onClick={() => setShowAddressesModal(true)}
                  className="text-accent hover:text-accent/80 transition-colors"
                  title="Ver todos os endereços"
                  aria-label="Ver todos os endereços"
                >
                  <i className="fas fa-plus-circle"></i>
                </button>
              )}
            </div>
            {validAddresses.length > 0 ? (
              <p className="text-sm text-gray-700 flex items-start gap-2">
                <i className="fas fa-location-dot text-xs text-accent mt-1 flex-shrink-0"></i>
                <span className="line-clamp-2">{validAddresses[0]}</span>
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">Sem informações</p>
            )}
          </div>

        {customer.notes && (
          <p className="text-sm text-gray-500 italic mb-4">
            <i className="fas fa-quote-left text-xs text-gray-300 mr-2"></i>
            {customer.notes}
          </p>
        )}

        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={() => onEdit(customer)}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <i className="fas fa-pen"></i>
            Editar
          </button>
          {customer.needs_review && (
            <button
              onClick={() => onReview(customer)}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-accent hover:bg-accent/10 transition-colors"
            >
              <i className="fas fa-check-circle"></i>
              Revisar
            </button>
          )}
          {hasDuplicate && (
            <button
              onClick={() => onMerge(customer)}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-accent hover:bg-accent/10 transition-colors"
            >
              <i className="fas fa-code-merge"></i>
              Mesclar
            </button>
          )}
          <button
            onClick={() => onDelete(customer.id)}
            aria-label={`Excluir cliente ${customer.name}`}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
        </div>
      </Card>

      {showAddressesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-950/50"
            onClick={() => setShowAddressesModal(false)}
          />
          <div className="relative bg-gray-50 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">
                Endereços de {customer.name}
              </h3>
              <button
                onClick={() => setShowAddressesModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <i className="fas fa-xmark"></i>
              </button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh]">
              {validAddresses.map((address, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <i className="fas fa-location-dot text-accent mt-0.5"></i>
                  <span className="text-sm text-gray-700">{address}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSave: (data: Partial<Customer>) => Promise<boolean>;
}

function CustomerFormModal({ isOpen, onClose, customer, onSave }: CustomerFormModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [addresses, setAddresses] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone);
      setEmail(customer.email);
      setAddresses(customer.addresses || []);
      setNotes(customer.notes || '');
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setAddresses(['']);
      setNotes('');
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const filteredAddresses = addresses.filter(a => a.trim());
    const success = await onSave({
      name,
      phone,
      email,
      addresses: filteredAddresses,
      notes: notes || null,
    });

    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  const addAddress = () => {
    setAddresses(prev => [...prev, '']);
  };

  const removeAddress = (index: number) => {
    setAddresses(prev => prev.filter((_, i) => i !== index));
  };

  const updateAddress = (index: number, value: string) => {
    setAddresses(prev => prev.map((addr, i) => i === index ? value : addr));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? 'Editar Cliente' : 'Novo Cliente'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 focus:border-gray-400 focus:outline-none transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 focus:border-gray-400 focus:outline-none transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 focus:border-gray-400 focus:outline-none transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Endereços</label>
          <div className="space-y-2">
            {addresses.map((addr, index) => (
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
                  <i className="fas fa-trash-can text-sm"></i>
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
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 focus:border-gray-400 focus:outline-none transition-colors"
            rows={3}
            placeholder="Notas sobre o cliente..."
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Salvando...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                Salvar
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Customers() {
  const navigate = useNavigate();
  const { isAuthenticated, isSuperAdmin } = useAuth();
  const { formatCurrency } = useThemeStore();
  const {
    customers,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    mergeCustomers,
    findDuplicates,
    resolveAlternateNames,
  } = useCustomers();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('alphabetical');
  const [editingCustomer, setEditingCustomer] = useState<CustomerWithTotalSpent | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [mergeModalCustomers, setMergeModalCustomers] = useState<CustomerWithTotalSpent[]>([]);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [reviewingCustomer, setReviewingCustomer] = useState<CustomerWithTotalSpent | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !isSuperAdmin()) {
      navigate('/');
      return;
    }
    fetchCustomers();
  }, [isAuthenticated, navigate, fetchCustomers, isSuperAdmin]);

  const duplicates = useMemo(() => findDuplicates(), [findDuplicates]);

  const duplicateCustomerIds = useMemo(() => {
    const ids = new Set<string>();
    duplicates.forEach(group => {
      group.customers.forEach(c => ids.add(c.id));
    });
    return ids;
  }, [duplicates]);

  const filteredAndSortedCustomers = useMemo(() => {
    let result = customers;

    if (searchQuery.trim()) {
      const search = searchQuery.toLowerCase().trim();
      result = result.filter(customer =>
        customer.name.toLowerCase().includes(search) ||
        customer.phone.includes(search) ||
        customer.email.toLowerCase().includes(search) ||
        customer.addresses?.some(a => a.toLowerCase().includes(search))
      );
    }

    if (sortMode === 'totalSpent') {
      result = [...result].sort((a, b) => b.totalSpent - a.totalSpent);
    } else {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name, 'pt'));
    }

    return result;
  }, [customers, searchQuery, sortMode]);

  const customersNeedingReview = useMemo(() => {
    return customers.filter(c => c.needs_review);
  }, [customers]);

  const handleEdit = (customer: CustomerWithTotalSpent) => {
    setEditingCustomer(customer);
    setShowFormModal(true);
  };

  const handleCreate = () => {
    setEditingCustomer(null);
    setShowFormModal(true);
  };

  const handleSave = async (data: Partial<Customer>): Promise<boolean> => {
    if (editingCustomer) {
      return await updateCustomer(editingCustomer.id, data);
    } else {
      const result = await createCustomer({
        name: data.name!,
        phone: data.phone!,
        email: data.email!,
        addresses: data.addresses,
        notes: data.notes,
      });
      return result !== null;
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;
    setIsDeleting(true);
    await deleteCustomer(deleteConfirm.id);
    setIsDeleting(false);
    setDeleteConfirm({ isOpen: false, id: null });
  };

  const handleMergeClick = (customer: CustomerWithTotalSpent) => {
    const group = duplicates.find(g =>
      g.customers.some(c => c.id === customer.id)
    );

    if (group && group.customers.length >= 2) {
      setMergeModalCustomers(group.customers.slice(0, 2));
      setShowMergeModal(true);
    }
  };

  const handleReviewClick = (customer: CustomerWithTotalSpent) => {
    setReviewingCustomer(customer);
    setShowReviewModal(true);
  };

  const handleResolveNames = async (chosenName: string) => {
    if (reviewingCustomer) {
      const success = await resolveAlternateNames(reviewingCustomer.id, chosenName);
      if (success) {
        setShowReviewModal(false);
        setReviewingCustomer(null);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-8">
      <PageHeader
        title="Clientes"
        description="Gestão dos clientes do negócio"
        icon="users"
      />

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="Pesquisar por nome, telefone, email ou endereço..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 h-12 rounded-lg border border-gray-200 hover:border-gray-300 focus:border-gray-400 focus:outline-none transition-colors"
          />
        </div>
        <button
          onClick={() => setSortMode(sortMode === 'alphabetical' ? 'totalSpent' : 'alphabetical')}
          className="flex items-center justify-center gap-2 h-12 px-4 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors whitespace-nowrap"
          title={sortMode === 'alphabetical' ? 'Ordenar por total gasto' : 'Ordenar por nome'}
        >
          <i className={`fas ${sortMode === 'alphabetical' ? 'fa-sort-alpha-down' : 'fa-coins'} text-accent`}></i>
          <span className="hidden sm:inline text-sm font-medium">
            {sortMode === 'alphabetical' ? 'A-Z' : 'Gasto'}
          </span>
        </button>
        <Button onClick={handleCreate} className="sm:w-auto">
          <i className="fas fa-plus-circle mr-2"></i>
          Novo Cliente
        </Button>
      </div>

      {customersNeedingReview.length > 0 && (
        <div className="mb-6 p-4 bg-accent/10 border border-accent/30 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <i className="fas fa-user-check text-accent"></i>
            </div>
            <div>
              <h4 className="font-semibold text-accent">
                {customersNeedingReview.length} cliente{customersNeedingReview.length !== 1 && 's'} precisa{customersNeedingReview.length === 1 ? '' : 'm'} de revisão
              </h4>
              <p className="text-sm text-accent">
                {customersNeedingReview.length === 1 ? 'Este cliente usou' : 'Estes clientes usaram'} nomes diferentes. Clique em "Revisar" para escolher o nome correto.
              </p>
            </div>
          </div>
        </div>
      )}

      {duplicates.length > 0 && (
        <div className="mb-6 p-4 bg-gray-100 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <i className="fas fa-triangle-exclamation text-gray-600"></i>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">
                {duplicates.length} grupo{duplicates.length !== 1 && 's'} de clientes duplicados
              </h4>
              <p className="text-sm text-gray-600">
                Clientes com o mesmo telefone ou email foram encontrados. Considere mesclá-los.
              </p>
            </div>
          </div>
        </div>
      )}

      {filteredAndSortedCustomers.length === 0 ? (
        <EmptyState
          icon="users"
          title={searchQuery ? 'Nenhum cliente encontrado' : 'Nenhum cliente'}
          description={
            searchQuery
              ? 'Tente uma pesquisa diferente'
              : 'Os clientes serão criados automaticamente quando fizerem pedidos'
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredAndSortedCustomers.map(customer => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              hasDuplicate={duplicateCustomerIds.has(customer.id)}
              formatCurrency={formatCurrency}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onMerge={handleMergeClick}
              onReview={handleReviewClick}
            />
          ))}
        </div>
      )}

      <CustomerFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        customer={editingCustomer}
        onSave={handleSave}
      />

      <CustomerMergeModal
        isOpen={showMergeModal}
        onClose={() => setShowMergeModal(false)}
        customers={mergeModalCustomers}
        onMerge={mergeCustomers}
      />

      {reviewingCustomer && (
        <Modal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          title="Revisar Nomes do Cliente"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Este cliente usou diferentes nomes em pedidos. Escolha o nome correto a manter:
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleResolveNames(reviewingCustomer.name)}
                className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-accent hover:bg-accent/10 transition-all text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{reviewingCustomer.name}</p>
                    <p className="text-xs text-gray-500">Nome atual</p>
                  </div>
                  <i className="fas fa-check-circle text-accent"></i>
                </div>
              </button>

              {(reviewingCustomer.alternate_names || []).map((altName, index) => (
                <button
                  key={index}
                  onClick={() => handleResolveNames(altName)}
                  className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-accent hover:bg-accent/10 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{altName}</p>
                      <p className="text-xs text-gray-500">Nome alternativo {index + 1}</p>
                    </div>
                    <i className="fas fa-check-circle text-gray-300"></i>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                <i className="fas fa-info-circle mr-1"></i>
                Ao escolher um nome, os nomes alternativos serão removidos e o cliente não precisará mais de revisão.
              </p>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Excluir cliente"
        description="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
        confirmLabel="Excluir cliente"
        isLoading={isDeleting}
      />
    </div>
  );
}
