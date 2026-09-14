import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PageHeader from '@/components/ui/PageHeader';
import UploadForm from '@/components/UploadForm';
import NoteListItem from '@/components/ui/NoteListItem';
import EmptyState from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/Badge';
import { Upload } from 'lucide-react';
import UploadRowActions from '@/components/UploadRowActions';

export const dynamic = 'force-dynamic';

export default async function UploadsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const [subjects, uploads] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: 'asc' }, include: { units: true } }),
    prisma.resource.findMany({
      where: { uploadedById: session.user.id },
      include: { subject: true, unit: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title="My Uploads" subtitle="Manage your contributions to the library" />
      <UploadForm subjects={subjects} />

      <div className="space-y-4">
        <h2 className="text-card-title font-semibold text-ink">Your uploads ({uploads.length})</h2>
        {uploads.length > 0 ? (
          <div className="overflow-hidden rounded-md border border-border bg-surface shadow-sm">
            <div className="flex items-center gap-3.5 border-b border-border-soft bg-surface-soft px-4 py-3 text-micro font-semibold uppercase tracking-[0.07em] text-text-faint">
              <span className="w-10 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1">Title</span>
              <span className="hidden w-[112px] shrink-0 sm:block">Type</span>
              <span className="hidden w-[150px] shrink-0 lg:block">Subject</span>
              <span className="w-[74px] shrink-0 text-right">Added</span>
              <span className="w-[92px] shrink-0 text-right">Status</span>
              <span className="w-8 shrink-0" aria-hidden />
            </div>
            <ul className="divide-y divide-border-soft">
              {uploads.map((u) => (
                <li key={u.id}>
                  <NoteListItem
                    note={u as any}
                    variant="table"
                    middleColumn="subject"
                    trailing={
                      <>
                        <span className="hidden w-[92px] shrink-0 text-right lg:block">
                          <StatusBadge status={u.status} />
                        </span>
                        <UploadRowActions resourceId={u.id} title={u.title} />
                      </>
                    }
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <EmptyState title="No uploads yet" body="Files you share appear here once submitted." Icon={Upload} />
        )}
      </div>
    </div>
  );
}
