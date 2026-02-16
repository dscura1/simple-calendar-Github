import { useState, useEffect } from 'react';
import { useStore } from '../store';
import type { Note } from '../types/entities';
import { formatDate } from '../utils/dates';
import toast from 'react-hot-toast';
import { noteService } from '../services/notes';
import { contactSuggestionService, type ContactSuggestion } from '../services/contactSuggestions';
import { parseCommandWithAI } from '../parser';
import { executeCommand } from '../parser/executor';
import { theme } from '../styles/theme';

export function GeneralNotesView() {
  const {
    filteredNotes,
    filteredContacts,
    addNote,
    addTask,
    addEvent,
    updateNote,
    deleteNote,
    activeContextId,
  } = useStore();

  // Note editor state
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [topicTags, setTopicTags] = useState<string[]>([]);
  const [linkedContactIds, setLinkedContactIds] = useState<number[]>([]);

  // UI state
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [suggestedContacts, setSuggestedContacts] = useState<ContactSuggestion[]>([]);
  const [topicTagInput, setTopicTagInput] = useState('');
  const [quickInput, setQuickInput] = useState('');
  const [isProcessingQuickInput, setIsProcessingQuickInput] = useState(false);

  // Filter general notes
  const generalNotes = filteredNotes.filter(n => n.scope === 'general');

  // Filter by selected tag
  const displayedNotes = selectedTag
    ? generalNotes.filter(n => n.topicTags.includes(selectedTag))
    : generalNotes;

  // Load topic tags
  useEffect(() => {
    const loadTags = async () => {
      const tags = await noteService.getAllTopicTags(activeContextId || undefined);
      setAllTags(tags);
    };
    loadTags();
  }, [activeContextId, generalNotes.length]);

  // Load contact suggestions
  useEffect(() => {
    const loadSuggestions = async () => {
      if (activeContextId) {
        const suggestions = await contactSuggestionService.getSuggestedContacts(
          activeContextId,
          5
        );
        setSuggestedContacts(suggestions);
      }
    };
    loadSuggestions();
  }, [activeContextId]);

  // Update form when note is selected
  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title);
      setBody(selectedNote.body || '');
      setTopicTags(selectedNote.topicTags);
      setLinkedContactIds(selectedNote.linkedContactIds);
    }
  }, [selectedNote]);

  const handleNew = () => {
    setSelectedNote(null);
    setTitle('');
    setBody('');
    setTopicTags([]);
    setLinkedContactIds([]);
    setTopicTagInput('');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!activeContextId) {
      toast.error('Please select a context first');
      return;
    }

    try {
      if (selectedNote) {
        await updateNote(selectedNote.id!, {
          title,
          body,
          topicTags,
          linkedContactIds,
        });
        toast.success('Note updated!');
      } else {
        await addNote({
          contextId: activeContextId,
          title,
          body,
          scope: 'general',
          topicTags,
          linkedContactIds,
        });
        toast.success('General note created!');
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

  const handleAddTopicTag = () => {
    if (!topicTagInput.trim()) return;

    const newTags = topicTagInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0 && !topicTags.includes(tag));

    if (newTags.length > 0) {
      setTopicTags([...topicTags, ...newTags]);
      setTopicTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTopicTags(topicTags.filter(tag => tag !== tagToRemove));
  };

  const handleLinkContact = (contactId: number) => {
    if (!linkedContactIds.includes(contactId)) {
      setLinkedContactIds([...linkedContactIds, contactId]);
    }
  };

  const handleUnlinkContact = (contactId: number) => {
    setLinkedContactIds(linkedContactIds.filter(id => id !== contactId));
  };

  // Quick input with NLP parsing for action items
  const handleQuickInputSubmit = async () => {
    if (!quickInput.trim() || !activeContextId) {
      return;
    }

    setIsProcessingQuickInput(true);

    try {
      const command = await parseCommandWithAI(quickInput, filteredContacts, activeContextId);

      // If it's a high/medium confidence action item, execute it
      if (command.confidence === 'high' || command.confidence === 'medium') {
        const result = await executeCommand(command, {
          addTask,
          addEvent,
          addNote,
        });

        if (result.success) {
          toast.success(result.message);
          setQuickInput('');
          if (result.warnings.length > 0) {
            setTimeout(() => {
              result.warnings.forEach(w => toast(w, { icon: '⚠️', duration: 3000 }));
            }, 500);
          }
        } else {
          toast.error(result.message);
        }
      } else {
        // Low confidence: treat as note content
        setBody(quickInput);
        setQuickInput('');
        toast('Added to note body. Add topic tags and save!', { icon: '📝' });
      }
    } catch (error) {
      console.error('Command execution error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process command');
    } finally {
      setIsProcessingQuickInput(false);
    }
  };

  const linkedContacts = filteredContacts.filter(c => linkedContactIds.includes(c.id!));

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 52px)' }}>
      {/* Left: Notes List + Tags */}
      <div style={{
        width: '300px',
        borderRight: `1px solid ${theme.colors.border.default}`,
        background: theme.colors.bg.primary,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ padding: theme.spacing.lg, borderBottom: `1px solid ${theme.colors.border.default}` }}>
          <button
            onClick={handleNew}
            style={{
              width: '100%',
              padding: theme.spacing.sm,
              background: theme.colors.accent.primary,
              color: 'white',
              border: 'none',
              borderRadius: theme.radius.sm,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: theme.fontSize.sm,
            }}
          >
            + New General Note
          </button>
        </div>

        {/* Topic Tags Filter */}
        <div style={{ padding: theme.spacing.lg, borderBottom: `1px solid ${theme.colors.border.subtle}` }}>
          <div style={{
            fontSize: theme.fontSize.xs,
            fontWeight: 600,
            color: theme.colors.text.tertiary,
            marginBottom: theme.spacing.sm,
          }}>
            FILTER BY TAG
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            <button
              onClick={() => setSelectedTag(null)}
              style={{
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                fontSize: theme.fontSize.xs,
                fontWeight: 500,
                background: selectedTag === null ? theme.colors.accent.primary : theme.colors.bg.secondary,
                color: selectedTag === null ? 'white' : theme.colors.text.primary,
                border: `1px solid ${selectedTag === null ? theme.colors.accent.primary : theme.colors.border.default}`,
                borderRadius: theme.radius.sm,
                cursor: 'pointer',
              }}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                style={{
                  padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                  fontSize: theme.fontSize.xs,
                  fontWeight: 500,
                  background: selectedTag === tag ? theme.colors.accent.primary : theme.colors.bg.secondary,
                  color: selectedTag === tag ? 'white' : theme.colors.text.primary,
                  border: `1px solid ${selectedTag === tag ? theme.colors.accent.primary : theme.colors.border.default}`,
                  borderRadius: theme.radius.sm,
                  cursor: 'pointer',
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Notes List */}
        <div style={{ flex: 1, overflow: 'auto', padding: theme.spacing.sm }}>
          {displayedNotes.length === 0 ? (
            <p style={{ textAlign: 'center', color: theme.colors.text.tertiary, padding: theme.spacing.xl }}>
              {selectedTag ? `No notes with tag "${selectedTag}"` : 'No general notes yet'}
            </p>
          ) : (
            displayedNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => setSelectedNote(note)}
                style={{
                  padding: theme.spacing.md,
                  borderRadius: theme.radius.sm,
                  marginBottom: theme.spacing.xs,
                  cursor: 'pointer',
                  background: selectedNote?.id === note.id ? theme.colors.accent.bg : theme.colors.bg.secondary,
                  border: `1px solid ${selectedNote?.id === note.id ? theme.colors.accent.primary : theme.colors.border.subtle}`,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '2px', fontSize: theme.fontSize.sm }}>
                  {note.title}
                </div>
                {note.topicTags.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {note.topicTags.map(tag => (
                      <span
                        key={tag}
                        style={{
                          fontSize: theme.fontSize.xs,
                          padding: '2px 6px',
                          background: theme.colors.accent.bg,
                          color: theme.colors.accent.primary,
                          borderRadius: theme.radius.sm,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.tertiary, marginTop: '4px' }}>
                  {formatDate(note.updatedAt, 'MMM dd, yyyy')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Note Editor */}
      <div style={{ flex: 1, background: theme.colors.bg.primary, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{
          padding: theme.spacing.lg,
          background: theme.colors.bg.primary,
          borderBottom: `1px solid ${theme.colors.border.default}`,
          display: 'flex',
          gap: theme.spacing.sm,
          alignItems: 'center',
        }}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title..."
            style={{
              flex: 1,
              padding: theme.spacing.sm,
              border: `1px solid ${theme.colors.border.default}`,
              borderRadius: theme.radius.sm,
              fontSize: theme.fontSize.md,
              fontWeight: 600,
            }}
          />
          <button
            onClick={handleSave}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              background: theme.colors.accent.primary,
              color: 'white',
              border: 'none',
              borderRadius: theme.radius.sm,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: theme.fontSize.sm,
            }}
          >
            Save
          </button>
          {selectedNote && (
            <button
              onClick={handleDelete}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                background: theme.colors.error,
                color: 'white',
                border: 'none',
                borderRadius: theme.radius.sm,
                cursor: 'pointer',
                fontSize: theme.fontSize.sm,
              }}
            >
              Delete
            </button>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: theme.spacing.xl, display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
          {/* Quick Input for Action Items */}
          <div>
            <div style={{
              fontSize: theme.fontSize.xs,
              fontWeight: 600,
              color: theme.colors.text.tertiary,
              marginBottom: theme.spacing.sm,
            }}>
              QUICK ADD (For Tasks/Events)
            </div>
            <div style={{ display: 'flex', gap: theme.spacing.sm }}>
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isProcessingQuickInput) {
                    handleQuickInputSubmit();
                  }
                }}
                placeholder="e.g., 'Meeting with John Friday 2pm' or 'Call Sarah tomorrow'"
                disabled={isProcessingQuickInput}
                style={{
                  flex: 1,
                  padding: theme.spacing.sm,
                  border: `1px solid ${theme.colors.border.default}`,
                  borderRadius: theme.radius.sm,
                  fontSize: theme.fontSize.sm,
                }}
              />
              <button
                onClick={handleQuickInputSubmit}
                disabled={isProcessingQuickInput}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  background: theme.colors.accent.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: theme.radius.sm,
                  cursor: isProcessingQuickInput ? 'not-allowed' : 'pointer',
                  fontSize: theme.fontSize.sm,
                  opacity: isProcessingQuickInput ? 0.6 : 1,
                }}
              >
                {isProcessingQuickInput ? 'Processing...' : 'Add'}
              </button>
            </div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.tertiary, marginTop: theme.spacing.xs }}>
              Type action items here. They'll be created as events/tasks (not general notes).
            </div>
          </div>

          {/* Note Body */}
          <div>
            <div style={{
              fontSize: theme.fontSize.xs,
              fontWeight: 600,
              color: theme.colors.text.tertiary,
              marginBottom: theme.spacing.sm,
            }}>
              NOTE CONTENT
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your research or planning notes here..."
              style={{
                width: '100%',
                minHeight: '200px',
                padding: theme.spacing.md,
                border: `1px solid ${theme.colors.border.default}`,
                borderRadius: theme.radius.sm,
                fontSize: theme.fontSize.sm,
                fontFamily: 'inherit',
                lineHeight: '1.6',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Topic Tags */}
          <div>
            <div style={{
              fontSize: theme.fontSize.xs,
              fontWeight: 600,
              color: theme.colors.text.tertiary,
              marginBottom: theme.spacing.sm,
            }}>
              TOPIC TAGS
            </div>
            <div style={{ display: 'flex', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
              <input
                type="text"
                value={topicTagInput}
                onChange={(e) => setTopicTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTopicTag();
                  }
                }}
                placeholder="Add tags (comma-separated)..."
                style={{
                  flex: 1,
                  padding: theme.spacing.xs,
                  border: `1px solid ${theme.colors.border.default}`,
                  borderRadius: theme.radius.sm,
                  fontSize: theme.fontSize.sm,
                }}
              />
              <button
                onClick={handleAddTopicTag}
                style={{
                  padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                  background: theme.colors.accent.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: theme.radius.sm,
                  cursor: 'pointer',
                  fontSize: theme.fontSize.sm,
                }}
              >
                Add
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>
              {topicTags.map(tag => (
                <span
                  key={tag}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    background: theme.colors.accent.bg,
                    color: theme.colors.accent.primary,
                    borderRadius: theme.radius.sm,
                    fontSize: theme.fontSize.sm,
                  }}
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: theme.colors.accent.primary,
                      cursor: 'pointer',
                      padding: '0 2px',
                      fontSize: theme.fontSize.xs,
                    }}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Contact Suggestions */}
          {suggestedContacts.length > 0 && (
            <div>
              <div style={{
                fontSize: theme.fontSize.xs,
                fontWeight: 600,
                color: theme.colors.text.tertiary,
                marginBottom: theme.spacing.sm,
              }}>
                SUGGESTED CONTACTS
              </div>
              <div style={{ display: 'flex', gap: theme.spacing.xs, flexWrap: 'wrap' }}>
                {suggestedContacts.map(({ contact, reason }) => (
                  <button
                    key={contact.id}
                    onClick={() => handleLinkContact(contact.id!)}
                    disabled={linkedContactIds.includes(contact.id!)}
                    style={{
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      fontSize: theme.fontSize.xs,
                      border: `1px solid ${theme.colors.border.default}`,
                      borderRadius: theme.radius.sm,
                      background: linkedContactIds.includes(contact.id!) ? theme.colors.bg.tertiary : theme.colors.bg.primary,
                      color: linkedContactIds.includes(contact.id!) ? theme.colors.text.tertiary : theme.colors.text.primary,
                      cursor: linkedContactIds.includes(contact.id!) ? 'not-allowed' : 'pointer',
                    }}
                    title={reason}
                  >
                    {contact.name} {linkedContactIds.includes(contact.id!) && '✓'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Linked Contacts */}
          {linkedContacts.length > 0 && (
            <div>
              <div style={{
                fontSize: theme.fontSize.xs,
                fontWeight: 600,
                color: theme.colors.text.tertiary,
                marginBottom: theme.spacing.sm,
              }}>
                LINKED CONTACTS
              </div>
              <div style={{ display: 'flex', gap: theme.spacing.xs, flexWrap: 'wrap' }}>
                {linkedContacts.map(contact => (
                  <span
                    key={contact.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      background: theme.colors.bg.secondary,
                      color: theme.colors.text.primary,
                      borderRadius: theme.radius.sm,
                      fontSize: theme.fontSize.sm,
                    }}
                  >
                    {contact.name}
                    <button
                      onClick={() => handleUnlinkContact(contact.id!)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: theme.colors.text.secondary,
                        cursor: 'pointer',
                        padding: '0 2px',
                        fontSize: theme.fontSize.xs,
                      }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {selectedNote && (
          <div style={{
            padding: `${theme.spacing.sm} ${theme.spacing.xl}`,
            background: theme.colors.bg.primary,
            borderTop: `1px solid ${theme.colors.border.default}`,
            fontSize: theme.fontSize.xs,
            color: theme.colors.text.tertiary,
          }}>
            Last updated: {formatDate(selectedNote.updatedAt, 'MMM dd, yyyy h:mm a')}
          </div>
        )}
      </div>
    </div>
  );
}
