import { useState, useEffect } from 'react';
import { useStore } from '../store';
import type { Note } from '../types/entities';
import { formatDate } from '../utils/dates';
import toast from 'react-hot-toast';

export function NotesView() {
  const { filteredNotes, addNote, updateNote, deleteNote, activeContextId } = useStore();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title);
      setBody(selectedNote.body || '');
    }
  }, [selectedNote]);

  const handleNew = () => {
    if (!activeContextId) {
      toast.error('Please select a context first');
      return;
    }
    setSelectedNote(null);
    setTitle('');
    setBody('');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      if (selectedNote) {
        await updateNote(selectedNote.id!, { title, body });
        toast.success('Note updated!');
      } else {
        await addNote({
          contextId: activeContextId!,
          title,
          body,
        });
        toast.success('Note created!');
        handleNew();
      }
    } catch (error) {
      toast.error('Failed to save note');
    }
  };

  const handleDelete = async () => {
    if (selectedNote && confirm('Delete this note?')) {
      await deleteNote(selectedNote.id!);
      toast.success('Note deleted');
      handleNew();
    }
  };

  const sortedNotes = [...filteredNotes].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 140px)' }}>
      {/* Left: Notes List */}
      <div style={{
        width: '300px',
        borderRight: '1px solid #e5e7eb',
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <button
            onClick={handleNew}
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
            + New Note
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
          {sortedNotes.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
              No notes yet
            </p>
          ) : (
            sortedNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => setSelectedNote(note)}
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '4px',
                  cursor: 'pointer',
                  background: selectedNote?.id === note.id ? '#dbeafe' : '#f9fafb',
                  border: selectedNote?.id === note.id ? '1px solid #3b82f6' : '1px solid #e5e7eb',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>{note.title}</div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {formatDate(note.updatedAt, 'MMM dd, yyyy')}
                </div>
                {note.body && (
                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    marginTop: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {note.body.substring(0, 60)}...
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Note Editor */}
      <div style={{ flex: 1, background: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          padding: '16px',
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title..."
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 600,
            }}
          />
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
          {selectedNote && (
            <button
              onClick={handleDelete}
              style={{
                padding: '10px 20px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Delete
            </button>
          )}
        </div>

        <div style={{ flex: 1, padding: '20px' }}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your note here..."
            style={{
              width: '100%',
              height: '100%',
              padding: '16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '15px',
              fontFamily: 'inherit',
              lineHeight: '1.6',
              resize: 'none',
            }}
          />
        </div>

        {selectedNote && (
          <div style={{
            padding: '12px 20px',
            background: 'white',
            borderTop: '1px solid #e5e7eb',
            fontSize: '13px',
            color: '#6b7280',
          }}>
            Last updated: {formatDate(selectedNote.updatedAt, 'MMM dd, yyyy h:mm a')}
          </div>
        )}
      </div>
    </div>
  );
}
