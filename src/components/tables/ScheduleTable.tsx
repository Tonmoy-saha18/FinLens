import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Download, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ColumnDef<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
}

interface ScheduleTableProps<T> {
  title: string;
  subtitle?: string;
  columns: ColumnDef<T>[];
  data: T[];
  csvFilename?: string;
  defaultExpanded?: boolean;
}

export function ScheduleTable<T extends Record<string, any>>({
  title,
  subtitle,
  columns,
  data,
  csvFilename = 'schedule.csv',
  defaultExpanded = false,
}: ScheduleTableProps<T>) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(12);

  const totalPages = Math.ceil(data.length / pageSize);

  const paginatedData = useMemo(() => {
    if (pageSize === 0) return data;
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  const handleExportCsv = () => {
    if (data.length === 0) return;

    const headers = columns.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(',');
    const rows = data.map((row) =>
      columns
        .map((col) => {
          const val = row[col.key];
          if (val === undefined || val === null) return '""';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers, ...rows].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', csvFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-sm transition-all">
      <div className="flex flex-wrap items-center justify-between p-4 bg-muted/20 border-b border-border/50 gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            {title}
            <span className="text-xs font-normal text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-full">
              {data.length} periods
            </span>
          </h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {isExpanded && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 gap-1.5 text-xs font-medium"
          >
            {isExpanded ? (
              <>
                <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Hide Table</span>
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5 text-primary" />
                <span className="text-primary font-semibold">View Full Schedule</span>
                <ChevronDown className="h-3.5 w-3.5 text-primary" />
              </>
            )}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-3 animate-fade-in">
          <div className="overflow-x-auto rounded-lg border border-border/50">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold border-b border-border">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`px-3.5 py-2.5 ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      }`}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono">
                {paginatedData.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-muted/30 transition-colors tabular-nums text-foreground/90"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-3.5 py-2 whitespace-nowrap ${
                          col.align === 'right'
                            ? 'text-right'
                            : col.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                        }`}
                      >
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table controls */}
          <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-1 gap-2">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-7 text-xs bg-background border border-input rounded px-2 font-sans focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value={12}>12 rows</option>
                <option value={24}>24 rows</option>
                <option value={60}>60 rows</option>
                <option value={0}>All rows ({data.length})</option>
              </select>
            </div>

            {pageSize > 0 && totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2 text-xs"
                >
                  Previous
                </Button>
                <span className="px-2 font-mono text-[11px]">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 px-2 text-xs"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
