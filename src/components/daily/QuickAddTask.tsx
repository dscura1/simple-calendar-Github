import { useState } from 'react';
import { useStore } from '../../store';
import { DateTime } from 'luxon';
import toast from 'react-hot-toast';

interface QuickAddTaskProps {
  onClose: () => void;
}

export function QuickAddTask({ onClose }: QuickAddTaskProps) {
  const { activeContextId, addTask, filteredContacts } = useStore();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(DateTime.now().toISODate() || '');
  const [contactId, setContactId] = useState<number | undefined>(undefined);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Task title is required');
      return;
    }
    if (!activeContextId) {
      toast.error('Please select a context first');
      return;
    }

    try {
      await addTask({
        contextId: activeContextId,
        title: title.trim(),
        dueDate: dueDate ? DateTime.fromISO(dueDate).startOf('day').toMillis() : undefined,
        linkedContactIds: contactId ? [contactId] : [],
        priority,
        completed: false,
      });
      toast.success('Task created!');
      onClose();
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <h2 style={{ marginTop: 0 }}>✅ Add Task</h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Task *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Follow up with Sarah"
              autoFocus
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '15px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
              }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Link to Contact (Optional)
            </label>
            <select
              value={contactId || ''}
              onChange={(e) => setContactId(e.target.value ? Number(e.target.value) : undefined)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
              }}
            >
              <option value="">None</option>
              {filteredContacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name} {contact.company ? `(${contact.company})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '10px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Add Task
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px',
                background: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
