import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useStaff, StaffWithSchedule, DaySchedule } from '../hooks/useStaff';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Button } from '../components/ui/Button';
import type { Database } from '../types/supabase';

type Staff = Database['public']['Tables']['staff']['Row'];
type FilterMode = 'all' | 'active' | 'inactive';

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DEFAULT_SCHEDULE: DaySchedule[] = [
  { day_of_week: 0, start_time: '09:00', end_time: '18:00', is_day_off: true },
  { day_of_week: 1, start_time: '09:00', end_time: '18:00', is_day_off: false },
  { day_of_week: 2, start_time: '09:00', end_time: '18:00', is_day_off: false },
  { day_of_week: 3, start_time: '09:00', end_time: '18:00', is_day_off: false },
  { day_of_week: 4, start_time: '09:00', end_time: '18:00', is_day_off: false },
  { day_of_week: 5, start_time: '09:00', end_time: '18:00', is_day_off: false },
  { day_of_week: 6, start_time: '09:00', end_time: '18:00', is_day_off: true },
];

interface StaffCardProps {
  member: StaffWithSchedule;
  onEdit: (member: StaffWithSchedule) => void;
  onSchedule: (member: StaffWithSchedule) => void;
  onDelete: (id: string) => void;
  onToggleActive: (member: StaffWithSchedule) => void;
}

function StaffCard({ member, onEdit, onSchedule, onDelete, onToggleActive }: StaffCardProps) {
  const todaySchedule = useMemo(() => {
    const today = new Date().getDay();
    return member.schedules.find(s => s.day_of_week === today);
  }, [member.schedules]);

  return (
    <Card padding="none" className="overflow-hidden transition-shadow duration-300 hover:shadow-card-hover">
      <div className="p-5">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {member.photo_url ? (
              <img
                src={member.photo_url}
                alt={member.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <i className="fas fa-user text-2xl text-gray-400"></i>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-lg font-bold text-gray-800 font-title truncate">
                {member.name}
              </h3>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                member.active
                  ? 'bg-accent/10 text-accent'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {member.active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <p className="text-sm text-accent font-medium mb-1">{member.role}</p>
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <i className="fas fa-phone text-xs text-gray-400"></i>
              {member.phone}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
              Horas/Semana
            </p>
            <p className="text-lg font-bold text-gray-800">
              {member.weeklyHours}h
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
              Hoje
            </p>
            {todaySchedule ? (
              todaySchedule.is_day_off ? (
                <p className="text-sm font-medium text-gray-500">Folga</p>
              ) : (
                <p className="text-sm font-medium text-gray-800">
                  {todaySchedule.start_time.slice(0, 5)} - {todaySchedule.end_time.slice(0, 5)}
                </p>
              )
            ) : (
              <p className="text-sm text-gray-400">Sem horário</p>
            )}
          </div>
        </div>

        <div className="mb-4 min-h-[3rem] flex items-start">
          {member.notes && (
            <p className="text-sm text-gray-500 italic line-clamp-2">
              <i className="fas fa-quote-left text-xs text-gray-300 mr-2"></i>
              {member.notes}
            </p>
          )}
        </div>

        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={() => onEdit(member)}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <i className="fas fa-pen"></i>
            Editar
          </button>
          <button
            onClick={() => onSchedule(member)}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-accent hover:bg-accent/10 transition-colors"
          >
            <i className="fas fa-calendar-alt"></i>
            Horário
          </button>
          <button
            onClick={() => onToggleActive(member)}
            className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
              member.active
                ? 'text-gray-500 hover:bg-gray-100'
                : 'text-accent hover:bg-accent/10'
            }`}
            title={member.active ? 'Desativar' : 'Ativar'}
          >
            <i className={`fas ${member.active ? 'fa-user-slash' : 'fa-user-check'}`}></i>
          </button>
          <button
            onClick={() => onDelete(member.id)}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-accent transition-colors"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </Card>
  );
}

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Staff | null;
  onSave: (data: Partial<Staff>) => Promise<boolean>;
}

function StaffFormModal({ isOpen, onClose, member, onSave }: StaffFormModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (member) {
        setName(member.name);
        setRole(member.role);
        setPhone(member.phone);
        setEmail(member.email || '');
        setNotes(member.notes || '');
      } else {
        setName('');
        setRole('');
        setPhone('');
        setEmail('');
        setNotes('');
      }
    }
  }, [member, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const success = await onSave({
      name,
      role,
      phone,
      email: email || '',
      notes: notes || '',
    });

    setIsSubmitting(false);
    if (success) {
      setName('');
      setRole('');
      setPhone('');
      setEmail('');
      setNotes('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={member ? 'Editar Funcionário' : 'Novo Funcionário'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 focus:border-gray-400 focus:outline-none transition-colors"
              placeholder="Ex: Cozinheiro..."
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

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 focus:border-gray-400 focus:outline-none transition-colors"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 focus:border-gray-400 focus:outline-none transition-colors"
              rows={2}
              placeholder="Notas sobre o funcionário..."
            />
          </div>
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

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: StaffWithSchedule | null;
  onSave: (staffId: string, schedules: DaySchedule[]) => Promise<boolean>;
}

function ScheduleModal({ isOpen, onClose, member, onSave }: ScheduleModalProps) {
  const [schedules, setSchedules] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (member && member.schedules.length > 0) {
      const existingSchedules = [...DEFAULT_SCHEDULE];
      member.schedules.forEach(s => {
        const index = existingSchedules.findIndex(es => es.day_of_week === s.day_of_week);
        if (index !== -1) {
          existingSchedules[index] = {
            day_of_week: s.day_of_week,
            start_time: s.start_time.slice(0, 5),
            end_time: s.end_time.slice(0, 5),
            is_day_off: s.is_day_off,
          };
        }
      });
      setSchedules(existingSchedules);
    } else {
      setSchedules([...DEFAULT_SCHEDULE]);
    }
  }, [member]);

  const updateSchedule = (dayIndex: number, field: keyof DaySchedule, value: string | boolean) => {
    setSchedules(prev => prev.map((s, i) =>
      i === dayIndex ? { ...s, [field]: value } : s
    ));
  };

  const calculateTotalHours = () => {
    let totalMinutes = 0;
    schedules.forEach(schedule => {
      if (schedule.is_day_off) return;
      const [startHour, startMin] = schedule.start_time.split(':').map(Number);
      const [endHour, endMin] = schedule.end_time.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      if (endMinutes > startMinutes) {
        totalMinutes += endMinutes - startMinutes;
      }
    });
    return Math.round((totalMinutes / 60) * 10) / 10;
  };

  const handleSubmit = async () => {
    if (!member) return;
    setIsSubmitting(true);
    const success = await onSave(member.id, schedules);
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  if (!member) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Horário de ${member.name}`}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          {schedules.map((schedule, index) => (
            <div
              key={schedule.day_of_week}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                schedule.is_day_off ? 'bg-gray-100' : 'bg-gray-50'
              }`}
            >
              <div className="w-20 font-medium text-gray-700">
                {DAY_NAMES[schedule.day_of_week]}
              </div>
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="time"
                  value={schedule.start_time}
                  onChange={(e) => updateSchedule(index, 'start_time', e.target.value)}
                  disabled={schedule.is_day_off}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-50 disabled:bg-gray-100"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="time"
                  value={schedule.end_time}
                  onChange={(e) => updateSchedule(index, 'end_time', e.target.value)}
                  disabled={schedule.is_day_off}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-50 disabled:bg-gray-100"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={schedule.is_day_off}
                  onChange={(e) => updateSchedule(index, 'is_day_off', e.target.checked)}
                  className="hidden"
                />
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${schedule.is_day_off ? 'bg-accent border-accent' : 'border-gray-300 bg-white'}`}>
                  {schedule.is_day_off && <i className="fas fa-check text-white" style={{ fontSize: '9px' }}></i>}
                </div>
                <span className="text-sm text-gray-600">Folga</span>
              </label>
            </div>
          ))}
        </div>

        <div className="p-4 bg-accent/10 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700">Total Semanal</span>
            <span className="text-xl font-bold text-accent">{calculateTotalHours()}h</span>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
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
      </div>
    </Modal>
  );
}

export default function Staff() {
  const navigate = useNavigate();
  const { isAuthenticated, isSuperAdmin } = useAuth();
  const {
    staff,
    fetchStaff,
    createStaff,
    updateStaff,
    deleteStaff,
    updateSchedules,
  } = useStaff();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [editingMember, setEditingMember] = useState<StaffWithSchedule | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [schedulingMember, setSchedulingMember] = useState<StaffWithSchedule | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !isSuperAdmin()) {
      navigate('/');
      return;
    }
    fetchStaff();
  }, [isAuthenticated, navigate, fetchStaff, isSuperAdmin]);

  const filteredStaff = useMemo(() => {
    let result = staff;

    if (filterMode === 'active') {
      result = result.filter(m => m.active);
    } else if (filterMode === 'inactive') {
      result = result.filter(m => !m.active);
    }

    if (searchQuery.trim()) {
      const search = searchQuery.toLowerCase().trim();
      result = result.filter(member =>
        member.name.toLowerCase().includes(search) ||
        member.role.toLowerCase().includes(search) ||
        member.phone.includes(search)
      );
    }

    return result;
  }, [staff, searchQuery, filterMode]);

  const stats = useMemo(() => ({
    total: staff.length,
    active: staff.filter(m => m.active).length,
    inactive: staff.filter(m => !m.active).length,
  }), [staff]);

  const handleEdit = (member: StaffWithSchedule) => {
    setEditingMember(member);
    setShowFormModal(true);
  };

  const handleCreate = () => {
    setEditingMember(null);
    setShowFormModal(true);
  };

  const handleSchedule = (member: StaffWithSchedule) => {
    setSchedulingMember(member);
    setShowScheduleModal(true);
  };

  const handleSave = async (data: Partial<Staff>): Promise<boolean> => {
    if (editingMember) {
      return await updateStaff(editingMember.id, data);
    } else {
      const result = await createStaff({
        name: data.name!,
        role: data.role!,
        phone: data.phone!,
        email: data.email,
        photo_url: data.photo_url,
        hire_date: data.hire_date,
        hourly_rate: data.hourly_rate,
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
    await deleteStaff(deleteConfirm.id);
    setIsDeleting(false);
    setDeleteConfirm({ isOpen: false, id: null });
  };

  const handleToggleActive = async (member: StaffWithSchedule) => {
    await updateStaff(member.id, { active: !member.active });
  };

  const handleSaveSchedule = async (staffId: string, schedules: DaySchedule[]): Promise<boolean> => {
    return await updateSchedules(staffId, schedules);
  };

  return (
    <div className="max-w-4xl mx-auto pb-8">
      <PageHeader
        title="Equipe"
        description="Gestão dos funcionários e horários do negócio"
        icon="hat-chef"
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setFilterMode('all')}
          className={`p-4 rounded-lg border-2 transition-all ${
            filterMode === 'all'
              ? 'border-accent bg-accent/10'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          <p className="text-sm text-gray-500">Total</p>
        </button>
        <button
          onClick={() => setFilterMode('active')}
          className={`p-4 rounded-lg border-2 transition-all ${
            filterMode === 'active'
              ? 'border-accent bg-accent/10'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <p className="text-2xl font-bold text-accent">{stats.active}</p>
          <p className="text-sm text-gray-500">Ativos</p>
        </button>
        <button
          onClick={() => setFilterMode('inactive')}
          className={`p-4 rounded-lg border-2 transition-all ${
            filterMode === 'inactive'
              ? 'border-gray-500 bg-gray-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <p className="text-2xl font-bold text-gray-500">{stats.inactive}</p>
          <p className="text-sm text-gray-500">Inativos</p>
        </button>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="Pesquisar por nome, cargo ou telefone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 h-12 rounded-lg border border-gray-200 hover:border-gray-300 focus:border-gray-400 focus:outline-none transition-colors"
          />
        </div>
        <Button onClick={handleCreate} className="sm:w-auto">
          <i className="fas fa-plus-circle mr-2"></i>
          Novo Funcionário
        </Button>
      </div>

      {filteredStaff.length === 0 ? (
        <EmptyState
          icon="hat-chef"
          title={searchQuery || filterMode !== 'all' ? 'Nenhum funcionário encontrado' : 'Nenhum funcionário'}
          description={
            searchQuery || filterMode !== 'all'
              ? 'Tente uma pesquisa diferente ou ajuste os filtros'
              : 'Adicione o primeiro funcionário da sua equipe'
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredStaff.map(member => (
            <StaffCard
              key={member.id}
              member={member}
              onEdit={handleEdit}
              onSchedule={handleSchedule}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      <StaffFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingMember(null);
        }}
        member={editingMember}
        onSave={handleSave}
      />

      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        member={schedulingMember}
        onSave={handleSaveSchedule}
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Excluir funcionário"
        description="Tem certeza que deseja excluir este funcionário? Esta ação não pode ser desfeita."
        confirmLabel="Excluir funcionário"
        isLoading={isDeleting}
      />
    </div>
  );
}
