'use client';

import { useState } from 'react';
import Tabs from '@/components/ui/Tabs';
import NoteListTable from '@/components/ui/NoteListTable';
import EmptyState from '@/components/ui/EmptyState';

export default function SubjectTabs({
  subject,
  resources,
  bookmarkedIds,
}: {
  subject: any;
  resources: any[];
  bookmarkedIds?: Set<string>;
}) {
  const [active, setActive] = useState('units');

  const TABS = [
    { key: 'units', label: 'Units', count: resources.length },
    { key: 'pyq', label: 'PYQs', count: resources.filter((r) => r.type === 'PYQ').length },
    { key: 'assignments', label: 'Assignments', count: resources.filter((r) => r.type === 'ASSIGNMENT').length },
  ];

  return (
    <div className="space-y-6">
      <Tabs tabs={TABS} active={active} onChange={setActive} />

      {active === 'units' && (
        <div className="space-y-8">
          {subject.units.map((u: any) => {
            const unitResources = resources.filter((r) => r.unitId === u.id);
            if (unitResources.length === 0) return null;
            return (
              <section key={u.id} className="space-y-3">
                <h3 className="flex items-center gap-2 text-card-title font-semibold text-ink">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-tiny bg-primary-soft text-micro font-bold text-primary-strong">
                    {u.number}
                  </span>
                  {u.title}
                </h3>
                <NoteListTable notes={unitResources} bookmarkedIds={bookmarkedIds} />
              </section>
            );
          })}
          {resources.filter((r) => !r.unitId).length > 0 && (
            <section className="space-y-3">
              <h3 className="text-card-title font-semibold text-ink">Other Materials</h3>
              <NoteListTable notes={resources.filter((r) => !r.unitId)} bookmarkedIds={bookmarkedIds} />
            </section>
          )}
          {resources.length === 0 && <EmptyState title="No resources yet" body="Be the first to upload." />}
        </div>
      )}

      {active === 'pyq' && (
        <NoteListTable notes={resources.filter((r) => r.type === 'PYQ')} bookmarkedIds={bookmarkedIds} emptyTitle="No PYQs" />
      )}

      {active === 'assignments' && (
        <NoteListTable
          notes={resources.filter((r) => r.type === 'ASSIGNMENT')}
          bookmarkedIds={bookmarkedIds}
          emptyTitle="No assignments"
        />
      )}
    </div>
  );
}
