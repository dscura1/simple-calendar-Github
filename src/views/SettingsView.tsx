import { useState, useEffect } from 'react';
import { useStore } from '../store';
import type { Context, ContextType } from '../types/entities';
import toast from 'react-hot-toast';
import { openAIService } from '../services/openai';

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

  // OpenAI API Key state
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    // Load existing API key status
    setHasApiKey(openAIService.hasApiKey());
    const existingKey = openAIService.getApiKey();
    if (existingKey) {
      setApiKey(existingKey);
    }
  }, []);

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

  // OpenAI API Key handlers
  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    setIsTestingKey(true);
    try {
      const isValid = await openAIService.testApiKey(apiKey.trim());

      if (isValid) {
        openAIService.setApiKey(apiKey.trim());
        setHasApiKey(true);
        toast.success('API key saved and verified!');
      } else {
        toast.error('Invalid API key. Please check and try again.');
      }
    } catch (error) {
      toast.error('Failed to verify API key');
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleRemoveApiKey = () => {
    if (confirm('Remove OpenAI API key? You will fall back to the basic parser.')) {
      openAIService.clearApiKey();
      setApiKey('');
      setHasApiKey(false);
      toast.success('API key removed');
    }
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

      {/* OpenAI API Key */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <h2 style={{ marginTop: 0 }}>🤖 AI-Powered Parser (Optional)</h2>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          Enable AI-powered natural language parsing using OpenAI's gpt-4o-mini model (cheapest option).
          This significantly improves classification accuracy for dates, contacts, and intent detection.
        </p>

        {hasApiKey ? (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px' }}>✅</span>
              <span style={{ fontWeight: 600, color: '#166534' }}>API Key Configured</span>
            </div>
            <p style={{ color: '#15803d', fontSize: '14px', margin: '0 0 12px 0' }}>
              The AI-powered parser is active and will be used for all natural language inputs.
            </p>
            <button
              onClick={handleRemoveApiKey}
              style={{
                padding: '8px 16px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Remove API Key
            </button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                OpenAI API Key
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                  }}
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  style={{
                    padding: '10px 16px',
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  {showApiKey ? '🙈' : '👁️'}
                </button>
                <button
                  onClick={handleSaveApiKey}
                  disabled={isTestingKey}
                  style={{
                    padding: '10px 20px',
                    background: isTestingKey ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isTestingKey ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {isTestingKey ? 'Testing...' : 'Save & Test'}
                </button>
              </div>
            </div>

            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '14px',
              color: '#1e40af',
            }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>How to get an API key:</p>
              <ol style={{ margin: 0, paddingLeft: '20px' }}>
                <li>Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>platform.openai.com/api-keys</a></li>
                <li>Click "Create new secret key"</li>
                <li>Copy the key and paste it above</li>
                <li>Your key is stored locally in your browser (never sent to our servers)</li>
              </ol>
              <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                💡 Uses gpt-4o-mini model (~$0.15 per million input tokens, ~$0.60 per million output tokens)
              </p>
            </div>
          </div>
        )}
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
