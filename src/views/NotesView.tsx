import { useState, useEffect } from 'react';
import { useStore } from '../store';
import type { Note } from '../types/entities';
import { formatDate } from '../utils/dates';
import toast from 'react-hot-toast';
import { extractTemporal } from '../parser/temporalParser';
import { extractTasksFromNote } from '../parser/taskExtractor';

export function NotesView() {
  const { filteredNotes, filteredContacts, addNote, addTask, updateNote, deleteNote, activeContextId } = useStore();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [detectedDate, setDetectedDate] = useState<number | null>(null);
  const [detectedTasks, setDetectedTasks] = useState<number>(0);

  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title);
      setBody(selectedNote.body || '');
      setDetectedDate(selectedNote.dateRef || null);
    }
  }, [selectedNote]);

  // Auto-detect dates and tasks in note content
  useEffect(() => {
    const combinedText = `${title} ${body}`.trim();
    if (combinedText.length > 0) {
      // Detect date
      const temporal = extractTemporal(combinedText);
      if (temporal.dateStart && temporal.confidence > 0) {
        setDetectedDate(temporal.dateStart);
      } else {
        setDetectedDate(null);
      }

      // Detect tasks
      const tasks = extractTasksFromNote(body, detectedDate || undefined, filteredContacts);
      setDetectedTasks(tasks.length);
    } else {
      setDetectedDate(null);
      setDetectedTasks(0);
    }
  }, [title, body, detectedDate, filteredContacts]);

  const handleNew = () => {
    if (!activeContextId) {
      toast.error('Please select a context first');
      return;
    }
    setSelectedNote(null);
    setTitle('');
    setBody('');
    setDetectedDate(null);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      // Save the note first
      if (selectedNote) {
        await updateNote(selectedNote.id!, {
          title,
          body,
          dateRef: detectedDate || undefined
        });
        toast.success('Note updated!');
        if (detectedDate) {
          toast('📅 Linked to ' + new Date(detectedDate).toLocaleDateString(), {
            icon: '🔗',
            duration: 3000
          });
        }
      } else {
        await addNote({
          contextId: activeContextId!,
          title,
          body,
          dateRef: detectedDate || undefined,
          linkedContactIds: [],
          scope: detectedDate ? 'day' : 'general',
          topicTags: [],
        });
        toast.success('Note created!');
        if (detectedDate) {
          toast('📅 Linked to ' + new Date(detectedDate).toLocaleDateString(), {
            icon: '🔗',
            duration: 3000
          });
        }
      }

      // Extract and create tasks if detected
      if (detectedTasks > 0 && body.trim()) {
        const tasks = extractTasksFromNote(body, detectedDate || undefined, filteredContacts);

        if (tasks.length > 0) {
          // Ask user if they want to create tasks
          const shouldCreate = confirm(
            `Found ${tasks.length} task${tasks.length > 1 ? 's' : ''} in note:\n\n` +
            tasks.map(t => `• ${t.title}`).join('\n') +
            `\n\nCreate these as tasks?`
          );

          if (shouldCreate) {
            for (const task of tasks) {
              await addTask({
                contextId: activeContextId!,
                title: task.title,
                dueDate: task.dueDate,
                linkedContactIds: task.contactId ? [task.contactId] : [],
                completed: false,
                priority: 'medium',
              });
            }
            toast.success(`✅ Created ${tasks.length} task${tasks.length > 1 ? 's' : ''}!`);
          }
        }
      }

      if (!selectedNote) {
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

        <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Date detection indicator */}
          {detectedDate && (
            <div style={{
              padding: '10px 12px',
              background: '#dbeafe',
              border: '1px solid #3b82f6',
              borderRadius: '6px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span>📅</span>
              <span style={{ fontWeight: 600 }}>Auto-detected date:</span>
              <span style={{ color: '#1e40af' }}>
                {new Date(detectedDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#6b7280' }}>
                (will be linked to Daily view)
              </span>
            </div>
          )}

          {/* Task detection indicator */}
          {detectedTasks > 0 && (
            <div style={{
              padding: '10px 12px',
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '6px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span>✅</span>
              <span style={{ fontWeight: 600 }}>Detected {detectedTasks} task{detectedTasks > 1 ? 's' : ''}:</span>
              <span style={{ color: '#92400e' }}>
                Will offer to create when saved
              </span>
            </div>
          )}

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your note here... (dates will be auto-detected)"
            style={{
              flex: 1,
              width: '100%',
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
