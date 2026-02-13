import { useStore } from '../store';
import { startOfDay, endOfDay, formatTime } from '../utils/dates';
import { useState } from 'react';
import toast from 'react-hot-toast';

export function DailyCommandCenter() {
  const { filteredEvents, filteredTasks, filteredNotes, toggleTaskComplete, activeContextId } = useStore();
  const [quickInput, setQuickInput] = useState('');

  const todayStart = startOfDay();
  const todayEnd = endOfDay();

  const todaysEvents = filteredEvents.filter(
    (e) => e.startTime >= todayStart && e.startTime <= todayEnd
  );

  const todaysTasks = filteredTasks.filter(
    (t) => t.dueDate && t.dueDate >= todayStart && t.dueDate <= todayEnd
  );

  const todaysNotes = filteredNotes.filter(
    (n) => n.dateRef && n.dateRef >= todayStart && n.dateRef <= todayEnd
  );

  const handleQuickInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickInput.trim()) {
      toast('Natural language parsing coming in F1!', { icon: '🚀' });
      setQuickInput('');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Quick Input */}
      <form onSubmit={handleQuickInputSubmit} style={{ marginBottom: '24px' }}>
        <input
          type="text"
          value={quickInput}
          onChange={(e) => setQuickInput(e.target.value)}
          placeholder="Type anything… (e.g., 'Follow up with Sarah next Tuesday')"
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '15px',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            outline: 'none',
          }}
          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
        />
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Left Panel */}
        <div>
          {/* Today's Schedule */}
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid #e5e7eb',
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>
              📅 Today's Schedule
            </h2>
            {todaysEvents.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>No events today</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {todaysEvents.map((event) => (
                  <div
                    key={event.id}
                    style={{
                      padding: '12px',
                      background: '#f0f9ff',
                      borderRadius: '6px',
                      borderLeft: '3px solid #3b82f6',
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                      {event.title}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      {formatTime(event.startTime)}
                      {event.endTime && ` - ${formatTime(event.endTime)}`}
                    </div>
                    {event.location && (
                      <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                        📍 {event.location}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Tasks */}
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '20px',
            border: '1px solid #e5e7eb',
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>
              ✅ Today's Tasks
            </h2>
            {todaysTasks.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>No tasks due today</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {todaysTasks.map((task) => (
                  <label
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px',
                      background: '#f9fafb',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTaskComplete(task.id!)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span style={{
                      flex: 1,
                      textDecoration: task.completed ? 'line-through' : 'none',
                      color: task.completed ? '#9ca3af' : '#374151',
                    }}>
                      {task.title}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div>
          {/* Today's Notes */}
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid #e5e7eb',
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>
              📝 Notes for Today
            </h2>
            {todaysNotes.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>No notes for today</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {todaysNotes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      padding: '12px',
                      background: '#fef3c7',
                      borderRadius: '6px',
                      borderLeft: '3px solid #f59e0b',
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                      {note.title}
                    </div>
                    {note.body && (
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        {note.body.substring(0, 100)}
                        {note.body.length > 100 && '...'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact Context */}
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '20px',
            border: '1px solid #e5e7eb',
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>
              👥 Upcoming Meetings
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>
              Contact context coming soon...
            </p>
          </div>
        </div>
      </div>

      {activeContextId === null && (
        <div style={{
          marginTop: '20px',
          padding: '12px',
          background: '#fef3c7',
          borderRadius: '6px',
          fontSize: '14px',
          color: '#92400e',
        }}>
          💡 <strong>Tip:</strong> Select a context (Work, Academic, Personal) above to filter your data
        </div>
      )}
    </div>
  );
}
