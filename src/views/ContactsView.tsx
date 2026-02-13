import { useState } from 'react';
import { useStore } from '../store';
import type { Contact } from '../types/entities';
import { formatDate } from '../utils/dates';
import toast from 'react-hot-toast';

export function ContactsView() {
  const { filteredContacts, addContact, updateContact, deleteContact, activeContextId } = useStore();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    role: '',
    email: '',
    phone: '',
    generalNotes: '',
  });

  const handleAddNew = () => {
    if (!activeContextId) {
      toast.error('Please select a context first');
      return;
    }
    setFormData({ name: '', company: '', role: '', email: '', phone: '', generalNotes: '' });
    setSelectedContact(null);
    setIsEditing(true);
  };

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setFormData({
      name: contact.name,
      company: contact.company || '',
      role: contact.role || '',
      email: contact.email || '',
      phone: contact.phone || '',
      generalNotes: contact.generalNotes || '',
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      if (selectedContact) {
        await updateContact(selectedContact.id!, formData);
        toast.success('Contact updated!');
      } else {
        await addContact({
          ...formData,
          contextId: activeContextId!,
        });
        toast.success('Contact added!');
      }
      setIsEditing(false);
      setSelectedContact(null);
    } catch (error) {
      toast.error('Failed to save contact');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this contact?')) {
      await deleteContact(id);
      toast.success('Contact deleted');
      setSelectedContact(null);
      setIsEditing(false);
    }
  };

  const sortedContacts = [...filteredContacts].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 140px)' }}>
      {/* Left: Contact List */}
      <div style={{
        width: '320px',
        borderRight: '1px solid #e5e7eb',
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <button
            onClick={handleAddNew}
            style={{
              width: '100%',
              padding: '10px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            + Add Contact
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
          {sortedContacts.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
              No contacts yet
            </p>
          ) : (
            sortedContacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => {
                  setSelectedContact(contact);
                  setIsEditing(false);
                }}
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '4px',
                  cursor: 'pointer',
                  background: selectedContact?.id === contact.id ? '#dbeafe' : '#f9fafb',
                  border: selectedContact?.id === contact.id ? '1px solid #3b82f6' : '1px solid #e5e7eb',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '2px' }}>{contact.name}</div>
                {contact.company && (
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>{contact.company}</div>
                )}
                {contact.role && (
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>{contact.role}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Contact Detail */}
      <div style={{ flex: 1, background: '#f9fafb', padding: '24px', overflow: 'auto' }}>
        {!selectedContact && !isEditing ? (
          <div style={{ textAlign: 'center', paddingTop: '100px', color: '#9ca3af' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
            <p>Select a contact or add a new one</p>
          </div>
        ) : isEditing ? (
          <div style={{ maxWidth: '600px' }}>
            <h2 style={{ marginTop: 0 }}>{selectedContact ? 'Edit Contact' : 'New Contact'}</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Role</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Notes</label>
                <textarea
                  value={formData.generalNotes}
                  onChange={(e) => setFormData({ ...formData, generalNotes: e.target.value })}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontFamily: 'inherit',
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
                  onClick={() => {
                    setIsEditing(false);
                    if (!selectedContact) setSelectedContact(null);
                  }}
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
                {selectedContact && (
                  <button
                    onClick={() => handleDelete(selectedContact.id!)}
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
        ) : selectedContact ? (
          <div style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ margin: '0 0 8px 0' }}>{selectedContact.name}</h2>
                {selectedContact.company && (
                  <p style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#6b7280' }}>
                    {selectedContact.company}
                  </p>
                )}
                {selectedContact.role && (
                  <p style={{ margin: 0, fontSize: '14px', color: '#9ca3af' }}>
                    {selectedContact.role}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleEdit(selectedContact)}
                style={{
                  padding: '8px 16px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Edit
              </button>
            </div>

            <div style={{ background: 'white', borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
              <h3 style={{ marginTop: 0 }}>Contact Information</h3>
              {selectedContact.email && (
                <p><strong>Email:</strong> {selectedContact.email}</p>
              )}
              {selectedContact.phone && (
                <p><strong>Phone:</strong> {selectedContact.phone}</p>
              )}
              {selectedContact.lastInteractionDate && (
                <p><strong>Last Interaction:</strong> {formatDate(selectedContact.lastInteractionDate)}</p>
              )}
              {selectedContact.nextFollowUpDate && (
                <p><strong>Next Follow-up:</strong> {formatDate(selectedContact.nextFollowUpDate)}</p>
              )}
            </div>

            {selectedContact.generalNotes && (
              <div style={{ background: 'white', borderRadius: '8px', padding: '20px' }}>
                <h3 style={{ marginTop: 0 }}>Notes</h3>
                <p style={{ whiteSpace: 'pre-wrap' }}>{selectedContact.generalNotes}</p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
