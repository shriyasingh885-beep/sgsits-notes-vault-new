import { prisma } from '@/lib/prisma';
import SubjectsGrid from '@/components/SubjectsGrid';

export const dynamic = 'force-dynamic';

export default async function SubjectsPage() {
  try {
    const subjects = await prisma.subject.findMany({ 
      include: { 
        _count: { select: { resources: { where: { status: 'APPROVED' } } } }, 
        semester: true,
        resources: { where: { status: 'APPROVED', type: 'PYQ' }, select: { id: true } }
      } 
    });

    const formattedSubjects = subjects.map(s => ({
      ...s,
      pyqsCount: s.resources.length
    }));

    return (
      <div className="space-y-8">
        <SubjectsGrid subjects={formattedSubjects as any} />
      </div>
    );
  } catch (err) {
    console.error("Failed to load subjects:", err);
    return (
      <div className="space-y-8">
        <SubjectsGrid subjects={[] as any} />
      </div>
    );
  }
}
