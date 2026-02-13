import { useState } from 'react';
import { DateTime } from 'luxon';
import { useStore } from '../../store';
import { startOfDay, endOfDay } from '../../utils/dates';

export function MonthlyCalendar() {
  const [currentDate, setCurrentDate] = useState(DateTime.now());
  const { filteredEvents } = useStore();

  const year = currentDate.year;
  const month = currentDate.month;

  const firstDay = DateTime.local(year, month, 1);
  const lastDay = firstDay.endOf('month');
  const startWeekday = firstDay.weekday % 7; // 0 = Sunday
  const daysInMonth = lastDay.day;

  const prevMonth = () => setCurrentDate(currentDate.minus({ months: 1 }));
  const nextMonth = () => setCurrentDate(currentDate.plus({ months: 1 }));
  const goToday = () => setCurrentDate(DateTime.now());

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get events for a specific day
  const getEventsForDay = (day: number) => {
    const dayStart = startOfDay(DateTime.local(year, month, day));
    const dayEnd = endOfDay(DateTime.local(year, month, day));
    return filteredEvents.filter(
      (e) => e.startTime >= dayStart && e.startTime <= dayEnd
    );
  };

  const isToday = (day: number) => {
    const today = DateTime.now();
    return today.year === year && today.month === month && today.day === day;
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>
          {currentDate.toFormat('MMMM yyyy')}
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={prevMonth}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              background: 'white',
              cursor: 'pointer',
            }}
          >
            ◀ Prev
          </button>
          <button
            onClick={goToday}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              background: 'white',
              cursor: 'pointer',
            }}
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              background: 'white',
              cursor: 'pointer',
            }}
          >
            Next ▶
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '8px',
        marginBottom: '8px',
      }}>
        {weekdays.map((day) => (
          <div
            key={day}
            style={{
              fontWeight: 700,
              textAlign: 'center',
              padding: '8px',
              color: '#6b7280',
              fontSize: '14px',
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '8px',
      }}>
        {/* Leading blanks */}
        {Array.from({ length: startWeekday }).map((_, i) => (
          <div
            key={`blank-${i}`}
            style={{
              minHeight: '100px',
              background: '#f9fafb',
              borderRadius: '6px',
            }}
          />
        ))}

        {/* Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayEvents = getEventsForDay(day);
          const today = isToday(day);

          return (
            <div
              key={day}
              style={{
                minHeight: '100px',
                padding: '8px',
                background: today ? '#dbeafe' : 'white',
                border: today ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}>
                <span style={{
                  fontWeight: 700,
                  fontSize: '16px',
                  color: today ? '#1e40af' : '#374151',
                }}>
                  {day}
                </span>
                {today && (
                  <span style={{
                    fontSize: '11px',
                    color: '#3b82f6',
                    fontWeight: 600,
                  }}>
                    Today
                  </span>
                )}
              </div>

              {/* Events */}
              {dayEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  style={{
                    fontSize: '12px',
                    background: '#dbeafe',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    borderLeft: '3px solid #3b82f6',
                  }}
                >
                  {event.title}
                </div>
              ))}

              {dayEvents.length > 3 && (
                <div style={{
                  fontSize: '11px',
                  color: '#6b7280',
                  fontStyle: 'italic',
                }}>
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
