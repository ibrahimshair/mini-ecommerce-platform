import "./Pagination.css";

/**
 * Standardized Pagination Component
 * Displays current page range, page navigation buttons with smart ellipsis, and page size selector.
 */
export default function Pagination({
  page = 1,
  totalPages = 1,
  onPageChange,
  totalItems = 0,
  limit = 12,
  onLimitChange,
}) {
  if (totalPages <= 1 && totalItems <= limit) {
    return null;
  }

  // Calculate visible range numbers
  const startItem = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);

      if (page <= 3) {
        start = 2;
        end = 4;
      } else if (page >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
      }

      if (start > 2) {
        pages.push("ellipsis-1");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push("ellipsis-2");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="pagination-wrapper">
      <div className="pagination-info">
        <span>
          Toplam <strong>{totalItems}</strong> üründen{" "}
          <strong>
            {startItem}-{endItem}
          </strong>{" "}
          arası gösteriliyor
        </span>

        {onLimitChange && (
          <div className="pagination-limit-picker">
            <label htmlFor="page-limit-select">Sayfa Başına:</label>
            <select
              id="page-limit-select"
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="pagination-select"
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
            </select>
          </div>
        )}
      </div>

      <nav className="pagination-nav" aria-label="Sayfalama">
        {/* First Page */}
        <button
          type="button"
          className="pagination-btn pagination-edge"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          title="İlk Sayfa"
          aria-label="İlk Sayfa"
        >
          «
        </button>

        {/* Previous Page */}
        <button
          type="button"
          className="pagination-btn pagination-prev"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          title="Önceki Sayfa"
          aria-label="Önceki Sayfa"
        >
          ‹
        </button>

        {/* Page Numbers */}
        <div className="pagination-pages">
          {pages.map((p, index) => {
            if (typeof p === "string" && p.startsWith("ellipsis")) {
              return (
                <span key={`${p}-${index}`} className="pagination-ellipsis">
                  ...
                </span>
              );
            }

            return (
              <button
                key={p}
                type="button"
                className={`pagination-btn pagination-num ${page === p ? "is-active" : ""}`}
                onClick={() => onPageChange(p)}
                aria-current={page === p ? "page" : undefined}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          className="pagination-btn pagination-next"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          title="Sonraki Sayfa"
          aria-label="Sonraki Sayfa"
        >
          ›
        </button>

        {/* Last Page */}
        <button
          type="button"
          className="pagination-btn pagination-edge"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          title="Son Sayfa"
          aria-label="Son Sayfa"
        >
          »
        </button>
      </nav>
    </div>
  );
}
