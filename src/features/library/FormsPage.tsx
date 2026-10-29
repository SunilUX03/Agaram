import { QueryView } from '@/components/QueryView';
import { RouteHeader } from '@/app/usePage';
import { useQ } from '@/data/hooks';
import { LibraryRow } from './parts';

export default function FormsPage() {
  const query = useQ('library', ['form']);
  return (
    <>
      <RouteHeader id="library.forms" />
      <QueryView query={query} skeleton="row" skeletonCount={6}>
        {(rows) => (
          <ul className="plain-list">
            {rows.map((r) => (
              <LibraryRow key={r.id} item={r} />
            ))}
          </ul>
        )}
      </QueryView>
    </>
  );
}
