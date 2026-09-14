'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconButton } from '@/components/ui/IconButton';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import { ChevronLeft, ChevronRight, CalendarDays, Plus, Trash2 } from 'lucide-react';
import { formatEventDate } from '@/lib/format';
import { cn } from '@/lib/cn';

const KIND_STYLE: Record<string, string> = {
  EXAM: 'bg-[color:var(--tint-terracotta)] border-transparent text-[color:var(--tint-terracotta-ink)]',
  ASSIGNMENT: 'bg-cream border-transparent text-cream-ink',
  REMINDER: 'bg-[color:var(--tint-lavender)] border-transparent text-[color:var(--tint-lavender-ink)]',
};

export default function ScheduleView({ events, isLoggedIn }: { events: any[]; isLoggedIn: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', kind: 'REMINDER' });

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const monthEvents = events.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
  });

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  async function handleAdd() {
    if (!form.title.trim() || !form.date) {
      toast('Title and date are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast('Reminder added', 'success');
      setAddOpen(false);
      setForm({ title: '', date: '', kind: 'REMINDER' });
      router.refresh();
    } catch {
      toast('Could not add reminder', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/events?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast('Removed', 'success');
      router.refresh();
    } catch {
      toast('Could not remove this event', 'error');
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div className="flex items-center justify-between rounded-md border border-border bg-surface p-4 shadow-sm">
        <IconButton icon={<ChevronLeft size={16} />} onClick={prevMonth} label="Previous month" />
        <h2 className="text-card-title font-semibold text-ink">
          {currentMonth.toLocaleString('default', { month: 'long' })} {currentMonth.getFullYear()}
        </h2>
        <IconButton icon={<ChevronRight size={16} />} onClick={nextMonth} label="Next month" />
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-2 text-center text-meta font-semibold text-text-faint">{d}</div>
        ))}
        {blanks.map((b) => (
          <div key={`blank-${b}`} />
        ))}
        {days.map((d) => {
          const hasEvent = monthEvents.some((e) => new Date(e.date).getDate() === d);
          return (
            <div
              key={d}
              className={cn(
                'flex aspect-square items-center justify-center rounded-input text-body',
                hasEvent
                  ? 'bg-primary-soft font-bold text-primary-strong ring-1 ring-inset ring-sage-300'
                  : 'border border-border-soft bg-surface text-secondary',
              )}
            >
              {d}
            </div>
          );
        })}
      </div>

      <div className="space-y-3.5 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-card-title font-semibold text-ink">Events this month</h3>
          {isLoggedIn && (
            <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)}>
              <Plus size={16} /> Add reminder
            </Button>
          )}
        </div>

        {monthEvents.length > 0 ? (
          <div className="flex flex-col gap-2">
            {monthEvents.map((e) => (
              <div
                key={e.id}
                className={cn('flex items-center justify-between rounded-md border p-4 shadow-sm', KIND_STYLE[e.kind] ?? KIND_STYLE.REMINDER)}
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{e.title}</p>
                  <p className="text-meta text-secondary">{formatEventDate(e.date)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-[color-mix(in_srgb,var(--white)_60%,transparent)] px-2 py-1 text-[10px] font-bold uppercase tracking-wide">
                    {e.kind}
                  </span>
                  {isLoggedIn && e.userId && (
                    <button
                      onClick={() => handleDelete(e.id)}
                      aria-label="Delete event"
                      className="rounded-tiny p-1.5 text-secondary transition hover:bg-[color-mix(in_srgb,var(--white)_60%,transparent)] hover:text-danger"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border p-10 text-center text-muted">
            <CalendarDays size={22} />
            <p>No events scheduled for this month.</p>
          </div>
        )}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add reminder">
        <div className="space-y-4 p-4">
          <input
            type="text"
            placeholder="Event title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="h-10 w-full rounded-input border border-border bg-surface px-3 text-body"
          />
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="h-10 w-full rounded-input border border-border bg-surface px-3 text-body"
          />
          <select
            value={form.kind}
            onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
            className="h-10 w-full rounded-input border border-border bg-surface px-3 text-body"
          >
            <option value="REMINDER">Reminder</option>
            <option value="ASSIGNMENT">Assignment</option>
            <option value="EXAM">Exam</option>
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="tertiary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAdd} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
