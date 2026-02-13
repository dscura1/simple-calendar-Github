import { useState } from 'react';
import { DateTime } from 'luxon';
import { useStore } from '../../store';
import { formatTime } from '../../utils/dates';

export function WeeklyCalendar() {
  const [currentDate, setCurrentDate] = useState(DateTime.now());
  const { filteredEvents } = useStore();

  const startOfWeek = currentDate.startOf('week');
  const endOfWeek = currentDate.endOf('week');

  const prevWeek = () => setCurrentDate(currentDate.minus({ weeks: 1 }));
  const nextWeek = () => setCurrentDate(currentDate.plus({ weeks: 1 }));
  const goToday = () => setCurrentDate(DateTime.now());

  const weekDays = Array.from({ length: 7 }).map((_, i) =>
    startOfWeek.plus({ days: i })
  );

  const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7am - 9pm

  const getEventsForDay = (day: DateTime) => {
    const dayStart = day.startOf('day').toMillis();
    const dayEnd = day.endOf('day').toMillis();
    return filteredEvents.filter(
      (e) => e.startTime >= dayStart && e.startTime <= dayEnd
    );
  };

  const isToday = (day: DateTime) => {
    const today = DateTime.now();
    return day.hasSame(today, 'day');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>
          {startOfWeek.toFormat('MMM dd')} - {endOfWeek.toFormat('MMM dd, yyyy')}
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={prevWeek} style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            background: 'white',
            cursor: 'pointer',
          }}>
            ◀ Prev
          </button>
          <button onClick={goToday} style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            background: 'white',
            cursor: 'pointer',
          }}>
            Today
          </button>
          <button onClick={nextWeek} style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            background: 'white',
            cursor: 'pointer',
          }}>
            Next ▶
          </button>
        </div>
      </div>

      {/* Week grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '60px repeat(7, 1fr)',
        gap: '4px',
      }}>
        {/* Time labels column header */}
        <div style={{ padding: '8px' }} />

        {/* Day headers */}
        {weekDays.map((day) => (
          <div
            key={day.toISO()}
            style={{
              padding: '12px',
              textAlign: 'center',
              background: isToday(day) ? '#dbeafe' : '#f9fafb',
              borderRadius: '6px',
              border: isToday(day) ? '2px solid #3b82f6' : '1px solid #e5e7eb',
            }}
          >
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>
              {day.toFormat('EEE')}
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: isToday(day) ? 700 : 600,
              color: isToday(day) ? '#1e40af' : '#374151',
            }}>
              {day.day}
            </div>
          </div>
        ))}

        {/* Time slots */}
        {hours.map((hour) => (
          <div key={hour} style={{ display: 'contents' }}>
            {/* Time label */}
            <div style={{
              padding: '8px',
              fontSize: '12px',
              color: '#6b7280',
              textAlign: 'right',
            }}>
              {DateTime.local().set({ hour }).toFormat('ha')}
            </div>

            {/* Day columns */}
            {weekDays.map((day) => {
              const dayEvents = getEventsForDay(day);
              const hourStart = day.set({ hour }).toMillis();
              const hourEnd = day.set({ hour: hour + 1 }).toMillis();
              const hourEvents = dayEvents.filter(
                (e) => e.startTime >= hourStart && e.startTime < hourEnd
              );

              return (
                <div
                  key={`${day.toISO()}-${hour}`}
                  style={{
                    minHeight: '60px',
                    padding: '4px',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  {hourEvents.map((event) => (
                    <div
                      key={event.id}
                      style={{
                        fontSize: '11px',
                        background: '#dbeafe',
                        padding: '4px',
                        borderRadius: '3px',
                        borderLeft: '3px solid #3b82f6',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{event.title}</div>
                      <div style={{ fontSize: '10px', color: '#6b7280' }}>
                        {formatTime(event.startTime)}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
