'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UploadDropzone from '@/components/ui/UploadDropzone';
import Select from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import Card from '@/components/ui/Card';

export default function UploadForm({ subjects }: { subjects: any[] }) {
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    toast('Upload successful', 'success');
    router.push('/uploads');
    router.refresh();
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto border-border">
      <form onSubmit={handleSubmit} className="space-y-6">
        <UploadDropzone file={file} onChange={setFile} />

        <div>
          <label className="block text-meta font-medium mb-1">Your name</label>
          <input
            type="text"
            name="uploaderName"
            placeholder="e.g. Viral Sharma"
            className="w-full h-10 px-3 rounded-input border border-border bg-surface text-body focus:ring-2 focus:ring-sage-500 outline-none"
            required
          />
          <p className="mt-1.5 text-micro text-muted">
            Notes Hub has no accounts — the name you enter here is shown publicly as the
            uploader on anything you submit.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-meta font-medium mb-1">Subject</label>
            <Select>
              <option>Select subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
          <div>
            <label className="block text-meta font-medium mb-1">Type</label>
            <Select>
              <option value="NOTES">Notes</option>
              <option value="PYQ">PYQ</option>
              <option value="ASSIGNMENT">Assignment</option>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-meta font-medium mb-1">Title</label>
          <input type="text" className="w-full h-10 px-3 rounded-input border border-border bg-surface text-body focus:ring-2 focus:ring-sage-500 outline-none" required />
        </div>

        <Button variant="primary" size="lg" className="w-full justify-center">Submit Upload</Button>
      </form>
    </Card>
  );
}
