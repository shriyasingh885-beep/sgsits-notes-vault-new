import Link from "next/link";
import { File, FileText, Image as ImageIcon, Presentation, Sheet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { relativeTime } from "@/lib/format";
import { TypeBadge } from "./Badge";
import BookmarkButton from "./BookmarkButton";

export type NoteRowData = {
  id: string;
  title: string;
  type: string;
  fileType?: string | null;
  updatedAt?: Date | string | null;
  subject?: { id: string; name: string } | null;
  unit?: { number: number; title: string } | null;
  uploadedBy?: { name: string | null } | null;
};

const FILE_ICON: Record<string, LucideIcon> = {
  PDF: FileText,
  DOC: FileText,
  DOCX: FileText,
  TXT: FileText,
  PPT: Presentation,
  PPTX: Presentation,
  XLS: Sheet,
  XLSX: Sheet,
  PNG: ImageIcon,
  JPG: ImageIcon,
  JPEG: ImageIcon,
};

export function fileIcon(fileType?: string | null): LucideIcon {
  return FILE_ICON[(fileType ?? "").toUpperCase()] ?? File;
}

/**
 * One note, one row. `variant="table"` is the TITLE / TYPE / UPLOADED BY /
 * UPDATED column layout; `variant="row"` is the looser card-list form. Pass
 * `bookmarked` (a real boolean, not undefined) to render a live bookmark
 * toggle instead of the caller-supplied `right` slot.
 */
export default function NoteListItem({
  note,
  variant = "row",
  right,
  bookmarked,
  trailing,
  snippet,
  middleColumn = "uploader",
  className,
}: {
  note: NoteRowData;
  variant?: "row" | "table";
  right?: React.ReactNode;
  bookmarked?: boolean;
  /** matched text from inside the document, shown on search results */
  snippet?: string;
  /** table variant only — a custom slot (e.g. a status badge) after Updated */
  trailing?: React.ReactNode;
  /** table variant only — what the 150px column shows */
  middleColumn?: "uploader" | "subject";
  className?: string;
}) {
  const Icon = fileIcon(note.fileType);
  const hover =
    "transition duration-calm ease-calm hover:bg-row-hover hover:shadow-[inset_3px_0_0_0_var(--sage-400)]";

  const iconBox = (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input bg-primary-soft text-primary-strong">
      <Icon size={17} strokeWidth={1.8} />
    </span>
  );

  if (variant === "table") {
    return (
      <Link
        href={`/notes/${note.id}`}
        className={cn("flex min-h-[64px] items-center gap-3.5 px-4 py-3", hover, className)}
      >
        {iconBox}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body-lg font-semibold text-ink">{note.title}</span>
          {note.subject && middleColumn !== "subject" && (
            <span className="mt-0.5 block truncate text-micro text-muted">{note.subject.name}</span>
          )}
          {snippet && (
            <span className="mt-1 block truncate text-micro italic text-text-faint">{snippet}</span>
          )}
        </span>
        <span className="hidden w-[112px] shrink-0 sm:block">
          <TypeBadge type={note.type} />
        </span>
        <span className="hidden w-[150px] shrink-0 truncate text-meta text-secondary lg:block">
          {middleColumn === "subject" ? note.subject?.name ?? "—" : note.uploadedBy?.name ?? "—"}
        </span>
        {/* relativeTime is computed from Date.now(), so the server and the
            client can straddle a minute boundary and disagree — that would
            otherwise blow away the whole hydrated tree. */}
        <span className="w-[74px] shrink-0 text-right text-meta text-muted" suppressHydrationWarning>
          {note.updatedAt ? relativeTime(note.updatedAt) : "—"}
        </span>
        {trailing}
        {bookmarked !== undefined && (
          <BookmarkButton resourceId={note.id} className="shrink-0" />
        )}
      </Link>
    );
  }

  return (
    <Link
      href={`/notes/${note.id}`}
      className={cn("flex items-center gap-3.5 rounded-input px-3.5 py-3", hover, className)}
    >
      {iconBox}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-lg font-semibold text-ink">{note.title}</span>
        <span className="mt-0.5 flex items-center gap-1.5 text-meta text-muted">
          {note.subject && <span className="truncate">{note.subject.name}</span>}
          {note.subject && <span aria-hidden>·</span>}
          <span className="shrink-0" suppressHydrationWarning>
            {note.updatedAt ? relativeTime(note.updatedAt) : "—"}
          </span>
        </span>
      </span>
      {bookmarked !== undefined ? (
        <BookmarkButton resourceId={note.id} className="shrink-0" />
      ) : (
        right && <span className="shrink-0 text-meta text-muted">{right}</span>
      )}
    </Link>
  );
}
