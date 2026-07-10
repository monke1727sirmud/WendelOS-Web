import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Trash2, MapPin, X, Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { CalendarEvent } from '../lib/types';

const EVENT_COLORS: Record<string, string> = {
  sky: 'bg-sky-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  cyan: 'bg-cyan-500',
  violet: 'bg-violet-500',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDateInput(d: Date) {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export default function CalendarApp() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState<Partial<CalendarEvent> | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0, 23, 59, 59);

    const { data } = await supabase
      .from('events')
      .select('*')
      .gte('start_at', startOfMonth.toISOString())
      .lte('start_at', endOfMonth.toISOString())
      .order('start_at', { ascending: true });

    if (data) setEvents(data as CalendarEvent[]);
    setLoading(false);
  }, [viewDate]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  const goToday = () => {
    setViewDate(new Date());
    setSelectedDate(new Date());
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isToday = (d: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === d;

  const getEventsForDay = (day: number) => {
    return events.filter((e) => {
      const d = new Date(e.start_at);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const handleDayClick = (day: number) => {
    const date = new Date(year, month, day);
    setSelectedDate(date);
  };

  const handleNewEvent = () => {
    const start = selectedDate ?? new Date();
    start.setHours(10, 0, 0, 0);
    const end = new Date(start);
    end.setHours(end.getHours() + 1);
    setEditEvent({
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      color: 'sky',
    });
    setShowModal(true);
  };

  const handleSaveEvent = async () => {
    if (!editEvent || !editEvent.title || !editEvent.start_at || !editEvent.end_at) return;
    const payload = {
      title: editEvent.title,
      description: editEvent.description ?? null,
      location: editEvent.location ?? null,
      start_at: editEvent.start_at,
      end_at: editEvent.end_at,
      color: editEvent.color ?? 'sky',
    };
    if (editEvent.id) {
      await supabase.from('events').update(payload).eq('id', editEvent.id);
    } else {
      await supabase.from('events').insert(payload);
    }
    setShowModal(false);
    setEditEvent(null);
    void loadEvents();
  };

  const handleDeleteEvent = async (id: string) => {
    await supabase.from('events').delete().eq('id', id);
    setShowModal(false);
    setEditEvent(null);
    void loadEvents();
  };

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-200">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 bg-slate-800/50 px-4 py-3">
        <h2 className="text-lg font-semibold text-white">
          {MONTHS[month]} {year}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextMonth}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={goToday}
          className="rounded-md border border-white/10 px-3 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/10"
        >
          Today
        </button>
        <button
          onClick={handleNewEvent}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-accent-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-600"
        >
          <Plus className="h-3.5 w-3.5" />
          New Event
        </button>
      </div>

      {/* Calendar grid */}
      <div className="flex flex-1 flex-col overflow-hidden p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : (
          <div className="grid flex-1 grid-cols-7 grid-rows-6 gap-1">
            {Array.from({ length: 42 }, (_, i) => {
              const day = i - firstDay + 1;
              const valid = day >= 1 && day <= daysInMonth;
              const dayEvents = valid ? getEventsForDay(day) : [];
              const isSelected =
                valid &&
                selectedDate &&
                selectedDate.getFullYear() === year &&
                selectedDate.getMonth() === month &&
                selectedDate.getDate() === day;

              return (
                <button
                  key={i}
                  onClick={() => valid && handleDayClick(day)}
                  disabled={!valid}
                  className={`flex flex-col items-start gap-0.5 rounded-lg border p-1.5 text-left transition ${
                    !valid
                      ? 'border-transparent'
                      : isSelected
                      ? 'border-accent-500 bg-accent-500/10'
                      : 'border-white/5 hover:border-white/15 hover:bg-white/5'
                  } ${isToday(day) ? 'ring-1 ring-accent-400/50' : ''}`}
                >
                  {valid && (
                    <>
                      <span
                        className={`text-xs font-medium ${
                          isToday(day) ? 'text-accent-400' : 'text-slate-400'
                        }`}
                      >
                        {day}
                      </span>
                      <div className="flex w-full flex-col gap-0.5 overflow-hidden">
                        {dayEvents.slice(0, 2).map((e) => (
                          <div
                            key={e.id}
                            className={`truncate rounded px-1 py-0.5 text-[9px] font-medium text-white ${EVENT_COLORS[e.color] ?? EVENT_COLORS.sky}`}
                          >
                            {e.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="text-[9px] text-slate-500">
                            +{dayEvents.length - 2} more
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected date events */}
      {selectedDate && (
        <div className="max-h-32 overflow-y-auto scrollbar-thin border-t border-white/10 bg-slate-800/30 p-3">
          <p className="mb-2 text-xs font-semibold text-slate-300">
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          {getEventsForDay(selectedDate.getDate()).length === 0 ? (
            <p className="text-xs text-slate-500">No events scheduled</p>
          ) : (
            <div className="space-y-1">
              {getEventsForDay(selectedDate.getDate()).map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    setEditEvent(e);
                    setShowModal(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-white/5"
                >
                  <div className={`h-2 w-2 rounded-full ${EVENT_COLORS[e.color]}`} />
                  <span className="text-xs font-medium text-slate-200">{e.title}</span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(e.start_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Event modal */}
      {showModal && editEvent && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="animate-scale-in w-80 rounded-2xl border border-white/10 bg-slate-800 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                {editEvent.id ? 'Edit Event' : 'New Event'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 transition hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                value={editEvent.title ?? ''}
                onChange={(e) => setEditEvent({ ...editEvent, title: e.target.value })}
                placeholder="Event title"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-accent-500"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-slate-500">Start</label>
                  <input
                    type="datetime-local"
                    value={editEvent.start_at ? formatDateInput(new Date(editEvent.start_at)) : ''}
                    onChange={(e) =>
                      setEditEvent({ ...editEvent, start_at: new Date(e.target.value).toISOString() })
                    }
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-white outline-none focus:border-accent-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-slate-500">End</label>
                  <input
                    type="datetime-local"
                    value={editEvent.end_at ? formatDateInput(new Date(editEvent.end_at)) : ''}
                    onChange={(e) =>
                      setEditEvent({ ...editEvent, end_at: new Date(e.target.value).toISOString() })
                    }
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-white outline-none focus:border-accent-500"
                  />
                </div>
              </div>

              <div className="relative">
                <MapPin className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  value={editEvent.location ?? ''}
                  onChange={(e) => setEditEvent({ ...editEvent, location: e.target.value })}
                  placeholder="Location (optional)"
                  className="w-full rounded-lg border border-white/10 bg-black/30 pl-8 pr-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-accent-500"
                />
              </div>

              <textarea
                value={editEvent.description ?? ''}
                onChange={(e) => setEditEvent({ ...editEvent, description: e.target.value })}
                placeholder="Description (optional)"
                rows={2}
                className="w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-accent-500"
              />

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Color:</span>
                {Object.entries(EVENT_COLORS).map(([name, cls]) => (
                  <button
                    key={name}
                    onClick={() => setEditEvent({ ...editEvent, color: name })}
                    className={`h-5 w-5 rounded-full ${cls} transition ${
                      editEvent.color === name ? 'ring-2 ring-white/50' : 'opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              {editEvent.id && (
                <button
                  onClick={() => void handleDeleteEvent(editEvent.id!)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 transition hover:bg-red-500/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={handleSaveEvent}
                disabled={!editEvent.title}
                className="ml-auto rounded-lg bg-accent-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-600 disabled:opacity-40"
              >
                {editEvent.id ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
