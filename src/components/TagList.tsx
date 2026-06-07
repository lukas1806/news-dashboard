export function TagList({ tags }: { tags: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Tags">
      {tags.map((tag) => (
        <li className="rounded border border-line px-2 py-1 text-xs text-muted" key={tag}>
          {tag}
        </li>
      ))}
    </ul>
  );
}
