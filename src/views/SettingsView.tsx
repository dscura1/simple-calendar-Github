import { useState } from 'react';
import { useStore } from '../store';
import type { Context, ContextType } from '../types/entities';
import toast from 'react-hot-toast';

export function SettingsView() {
  const { contexts, addContext, updateContext, deleteContext } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'work' as ContextType,
    parentId: undefined as number | undefined,
    color: '#3b82f6',
  });

  const topLevelContexts = contexts.filter((c) => !c.parentId);
  const workContext = topLevelContexts.find((c) => c.type === 'work');

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({ name: '', type: 'work', parentId: undefined, color: '#3b82f6' });
  };

  const handleEdit = (context: Context) => {
    setEditingId(context.id!);
    setIsAdding(false);
    setFormData({
      name: context.name,
      type: context.type,
      parentId: context.parentId,
      color: context.color || '#3b82f6',
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      if (editingId) {
        await updateContext(editingId, formData);
        toast.success('Context updated!');
      } else {
        await addContext(formData);
        toast.success('Context added!');
      }
      setIsAdding(false);
      setEditingId(null);
    } catch (error) {
      toast.error('Failed to save context');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this context? This will also delete all associated data.')) {
      await deleteContext(id);
      toast.success('Context deleted');
      setEditingId(null);
      setIsAdding(false);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>⚙️ Settings</h1>

      {/* Context Management */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <h2 style={{ margin: 0 }}>Context Management</h2>
          <button
            onClick={handleAdd}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            + Add Context
          </button>
        </div>

        {/* Form */}
        {(isAdding || editingId !== null) && (
          <div style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
          }}>
            <h3 style={{ marginTop: 0 }}>
              {editingId ? 'Edit Context' : 'New Context'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Acme Corp, Stanford, Personal Projects"
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
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as ContextType })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                  }}
                >
                  <option value="work">Work</option>
                  <option value="academic">Academic</option>
                  <option value="personal">Personal</option>
                </select>
              </div>

              {workContext && (
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                    Parent (for sub-companies)
                  </label>
                  <select
                    value={formData.parentId || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      parentId: e.target.value ? Number(e.target.value) : undefined
                    })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                    }}
                  >
                    <option value="">None (Top Level)</option>
                    {formData.type === 'work' && (
                      <option value={workContext.id}>Work (Sub-company)</option>
                    )}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  Color
                </label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  style={{
                    width: '100px',
                    height: '40px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleSave}
                  style={{
                    padding: '10px 20px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  style={{
                    padding: '10px 20px',
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                {editingId && (
                  <button
                    onClick={() => handleDelete(editingId)}
                    style={{
                      padding: '10px 20px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      marginLeft: 'auto',
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Context List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {topLevelContexts.map((context) => {
            const subContexts = contexts.filter((c) => c.parentId === context.id);

            return (
              <div key={context.id}>
                <div
                  style={{
                    padding: '16px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        background: context.color || '#3b82f6',
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '16px' }}>
                        {context.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280', textTransform: 'capitalize' }}>
                        {context.type}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEdit(context)}
                    style={{
                      padding: '6px 12px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                </div>

                {/* Sub-contexts */}
                {subContexts.length > 0 && (
                  <div style={{ marginLeft: '36px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {subContexts.map((sub) => (
                      <div
                        key={sub.id}
                        style={{
                          padding: '12px',
                          background: 'white',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '3px',
                              background: sub.color || '#3b82f6',
                            }}
                          />
                          <div style={{ fontSize: '14px', fontWeight: 600 }}>
                            {sub.name}
                          </div>
                        </div>
                        <button
                          onClick={() => handleEdit(sub)}
                          style={{
                            padding: '4px 10px',
                            background: 'white',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px',
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* App Info */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '24px',
      }}>
        <h2 style={{ marginTop: 0 }}>About</h2>
        <p style={{ color: '#6b7280', marginBottom: '12px' }}>
          <strong>Relationship Calendar CRM</strong> - Web App
        </p>
        <p style={{ color: '#6b7280', marginBottom: '12px' }}>
          Built with React, TypeScript, Zustand, Dexie (IndexedDB), and Luxon
        </p>
        <p style={{ color: '#6b7280', margin: 0 }}>
          All data stored locally in your browser
        </p>
      </div>
    </div>
  );
}
