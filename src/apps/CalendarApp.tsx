import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Trash2, MapPin, X, Loader2, Clock, Calendar, AlertTriangle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { CalendarEvent } from '../lib/types';
import { useQuota } from '../context/QuotaContext';

const EVENT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  sky:     { bg: 'bg-sky-500',     text: 'text-sky-400',     dot: 'bg-sky-500' },
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  amber:   { bg: 'bg-amber-500',   text: 'text-amber-400',   dot: 'bg-amber-500' },
  rose:    { bg: 'bg-rose-500',    text: 'text-rose-400',    dot: 'bg-rose-500' },
  cyan:    { bg: 'bg-cyan-500',    text: 'text-cyan-400',    dot: 'bg-cyan-500' },
  violet:  { bg: 'bg-violet-500',  text: 'text-violet-400',  dot: 'bg-violet-500' },
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function formatDateInput(d: Date) {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export default function CalendarApp() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState<Partial<CalendarEvent> | null>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const { limits, usage, refresh: refreshQuota, isOver } = useQuota();

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0, 23, 59, 59);
    const { data } = await supabase.from('events').select('*')
      .gte('start_at', start.toISOString()).lte('start_at', end.toISOString()).order('start_at');
    if (data) setEvents(data as CalendarEvent[]);
    setLoading(false);
  }, [viewDate]);

  useEffect(() => { void loadEvents(); }, [loadEvents]);

  const year = viewDate.getFullYear(), month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isToday = (d: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  const getEventsForDay = (day: number) =>
    events.filter(e => { const d = new Date(e.start_at); return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day; });

  const handleSave = async () => {
    if (!editEvent?.title || !editEvent.start_at || !editEvent.end_at) return;
    const isNew = !editEvent.id;
    if (isNew && isOver('events')) {
      setQuotaError(`Event limit reached (${limits.events_limit} events max). Delete some events to create more.`);
      setShowModal(false); setEditEvent(null);
      return;
    }
    const payload = { title: editEvent.title, description: editEvent.description ?? null, location: editEvent.location ?? null, start_at: editEvent.start_at, end_at: editEvent.end_at, color: editEvent.color ?? 'sky' };
    if (editEvent.id) await supabase.from('events').update(payload).eq('id', editEvent.id);
    else await supabase.from('events').insert(payload);
    if (isNew) void refreshQuota();
    setShowModal(false); setEditEvent(null); void loadEvents();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('events').delete().eq('id', id);
    void refreshQuota();
    setShowModal(false); setEditEvent(null); void loadEvents();
  };

  const selectedEvents = selectedDate ? getEventsForDay(selectedDate.getDate()) : [];

  return (
    <div className="flex h-full bg-[#1c1c1e] text-white/80">
      {/* Left panel — mini calendar + event list */}
      <div className="flex w-56 shrink-0 flex-col border-r border-white/8 bg-[#252528]">
        {/* Month nav */}
        <div className="flex items-center gap-1 border-b border-white/8 px-3 py-2.5">
          <button onClick={() => setViewDate(new Date(year, month - 1, 1))}
            className="flex h-6 w-6 items-center justify-center rounded-md text-white/30 hover:bg-white/8 hover:text-white transition">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="flex-1 text-center text-xs font-semibold text-white/70">{MONTHS[month].slice(0,3)} {year}</span>
          <button onClick={() => setViewDate(new Date(year, month + 1, 1))}
            className="flex h-6 w-6 items-center justify-center rounded-md text-white/30 hover:bg-white/8 hover:text-white transition">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Mini calendar */}
        <div className="p-3">
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map(d => <div key={d} className="text-center text-[9px] font-semibold text-white/20">{d[0]}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: 42 }, (_, i) => {
              const day = i - firstDay + 1;
              const valid = day >= 1 && day <= daysInMonth;
              const dayEvts = valid ? getEventsForDay(day) : [];
              const isSel = valid && selectedDate?.getDate() === day && selectedDate?.getMonth() === month;
              return (
                <button key={i} disabled={!valid} onClick={() => valid && setSelectedDate(new Date(year, month, day))}
                  className={`relative flex h-7 w-full items-center justify-center rounded-full text-[11px] transition ${
                    !valid ? 'invisible' :
                    isSel ? 'bg-accent-500 text-white font-semibold' :
                    isToday(day) ? 'ring-1 ring-accent-500 text-accent-400' :
                    'text-white/50 hover:bg-white/8'
                  }`}>
                  {valid && day}
                  {dayEvts.length > 0 && !isSel && <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-0.5 rounded-full bg-accent-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day events */}
        <div className="flex-1 overflow-y-auto border-t border-white/8 scrollbar-thin">
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/25">
              {selectedDate?.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <button onClick={() => {
              const start = selectedDate ?? new Date(); start.setHours(10,0,0,0);
              const end = new Date(start); end.setHours(11,0,0,0);
              setEditEvent({ start_at: start.toISOString(), end_at: end.toISOString(), color: 'sky' });
              setShowModal(true);
            }} className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-500/20 text-accent-400 hover:bg-accent-500/30 transition">
              <Plus className="h-3 w-3" />
            </button>
          </div>
          {selectedEvents.length === 0 ? (
            <p className="px-3 py-2 text-[10px] text-white/20">No events</p>
          ) : selectedEvents.map(e => {
            const c = EVENT_COLORS[e.color] ?? EVENT_COLORS.sky;
            return (
              <button key={e.id} onClick={() => { setEditEvent(e); setShowModal(true); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition">
                <div className={`h-2 w-2 shrink-0 rounded-full ${c.dot}`} />
                <div className="min-w-0">
                  <p className="truncate text-xs text-white/70">{e.title}</p>
                  <p className="text-[9px] text-white/25">{new Date(e.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main calendar grid */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/8 bg-[#1c1c1e] px-4 py-2.5">
          <Calendar className="h-4 w-4 text-accent-400" />
          <h2 className="text-sm font-semibold text-white">{MONTHS[month]} {year}</h2>
          <button onClick={() => { setViewDate(new Date()); setSelectedDate(new Date()); }}
            className="rounded-lg border border-white/10 px-3 py-1 text-xs text-white/40 transition hover:bg-white/8 hover:text-white">
            Today
          </button>
          {quotaError && (
            <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] text-amber-300">
              <AlertTriangle className="h-3 w-3 shrink-0" />{quotaError}
              <button onClick={() => setQuotaError(null)} className="ml-1 text-amber-400/50 hover:text-amber-300">✕</button>
            </div>
          )}
          <span className={`ml-auto text-[10px] tabular-nums ${isOver('events') ? 'text-red-400' : 'text-white/25'}`}>
            {usage.events_count}/{limits.events_limit} events
          </span>
          <button onClick={() => {
            if (isOver('events')) { setQuotaError(`Event limit reached (${limits.events_limit} max).`); return; }
            const start = selectedDate ?? new Date(); start.setHours(10,0,0,0);
            const end = new Date(start); end.setHours(11,0,0,0);
            setEditEvent({ start_at: start.toISOString(), end_at: end.toISOString(), color: 'sky' });
            setShowModal(true);
          }} className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition ${isOver('events') ? 'bg-white/8 text-white/25 cursor-not-allowed' : 'bg-accent-500 hover:bg-accent-600'}`}>
            <Plus className="h-3.5 w-3.5" /> New Event
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-white/8 bg-[#252528]">
          {WEEKDAYS.map(d => (
            <div key={d} className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-white/25">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/30" /></div>
        ) : (
          <div className="grid flex-1 grid-cols-7 grid-rows-6 overflow-hidden">
            {Array.from({ length: 42 }, (_, i) => {
              const day = i - firstDay + 1;
              const valid = day >= 1 && day <= daysInMonth;
              const dayEvts = valid ? getEventsForDay(day) : [];
              const isSel = valid && selectedDate?.getDate() === day && selectedDate?.getMonth() === month;
              return (
                <button key={i} disabled={!valid} onClick={() => valid && setSelectedDate(new Date(year, month, day))}
                  className={`flex flex-col items-start overflow-hidden border-b border-r border-white/5 p-1.5 text-left transition ${
                    !valid ? 'bg-[#161618]' :
                    isSel ? 'bg-accent-500/8' :
                    'hover:bg-white/3'
                  }`}>
                  {valid && (
                    <>
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                        isToday(day) ? 'bg-accent-500 text-white' : isSel ? 'text-accent-400 font-semibold' : 'text-white/40'
                      }`}>{day}</span>
                      <div className="mt-0.5 flex w-full flex-col gap-0.5 overflow-hidden">
                        {dayEvts.slice(0, 2).map(e => {
                          const c = EVENT_COLORS[e.color] ?? EVENT_COLORS.sky;
                          return (
                            <div key={e.id} className={`truncate rounded-md px-1.5 py-0.5 text-[9px] font-medium text-white ${c.bg} opacity-80`}>
                              {e.title}
                            </div>
                          );
                        })}
                        {dayEvts.length > 2 && <span className="text-[9px] text-white/25">+{dayEvts.length - 2}</span>}
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Event modal — macOS sheet style */}
      {showModal && editEvent && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="animate-scale-in w-80 rounded-2xl border border-white/10 bg-[#2a2a2e] p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">{editEvent.id ? 'Edit Event' : 'New Event'}</h3>
              <button onClick={() => setShowModal(false)} className="text-white/30 hover:text-white transition"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <input value={editEvent.title ?? ''} onChange={e => setEditEvent({ ...editEvent, title: e.target.value })}
                placeholder="Event title" autoFocus
                className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-accent-500/40" />
              <div className="grid grid-cols-2 gap-2">
                {[{ label: 'Start', key: 'start_at' }, { label: 'End', key: 'end_at' }].map(({ label, key }) => (
                  <div key={key}>
                    <label className="mb-1 flex items-center gap-1 text-[10px] text-white/30"><Clock className="h-3 w-3" />{label}</label>
                    <input type="datetime-local"
                      value={editEvent[key as keyof typeof editEvent] ? formatDateInput(new Date(editEvent[key as keyof typeof editEvent] as string)) : ''}
                      onChange={e => setEditEvent({ ...editEvent, [key]: new Date(e.target.value).toISOString() })}
                      className="w-full rounded-xl border border-white/8 bg-white/5 px-2 py-1.5 text-[11px] text-white outline-none focus:border-accent-500/40" />
                  </div>
                ))}
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/20" />
                <input value={editEvent.location ?? ''} onChange={e => setEditEvent({ ...editEvent, location: e.target.value })}
                  placeholder="Location" className="w-full rounded-xl border border-white/8 bg-white/5 pl-8 pr-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-accent-500/40" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/30">Color</span>
                {Object.entries(EVENT_COLORS).map(([name, c]) => (
                  <button key={name} onClick={() => setEditEvent({ ...editEvent, color: name })}
                    className={`h-5 w-5 rounded-full ${c.dot} transition ${editEvent.color === name ? 'ring-2 ring-white/40 scale-110' : 'opacity-50 hover:opacity-100'}`} />
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              {editEvent.id && (
                <button onClick={() => void handleDelete(editEvent.id!)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 hover:bg-red-500/15 transition">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <button onClick={handleSave} disabled={!editEvent.title}
                className="ml-auto rounded-xl bg-accent-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-600 disabled:opacity-40">
                {editEvent.id ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
