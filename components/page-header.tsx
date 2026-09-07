import Link from "next/link";

export function PageHeader({ title }: { title: string }) {
  return (
    <header className="flex items-center gap-3 pb-6">
      <Link
        href="/"
        className="rounded-lg border border-neutral-800 px-2.5 py-1.5 text-sm text-neutral-400 hover:text-neutral-100"
      >
        ←
      </Link>
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
    </header>
  );
}
