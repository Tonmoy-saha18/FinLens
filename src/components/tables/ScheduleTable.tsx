import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Download, Eye, EyeOff, Table as TableIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ColumnDef<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
}

export interface ScheduleTableProps<T> {
  id?: string;
  title: string;
  subtitle?: string;
  columns: ColumnDef<T>[];
  data: T[];
  csvFilename?: string;
  defaultExpanded?: boolean;
  filterSlot?: React.ReactNode;
}

export function ScheduleTable<T extends Record<string, any>>({
  id,
  title,
  subtitle,
  columns,
  data,
  csvFilename = 'schedule.csv',
  defaultExpanded = true,
  filterSlot,
}: ScheduleTableProps<T>) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(12);

  const totalPages = Math.ceil(data.length / (pageSize || 1));

  const paginatedData = useMemo(() => {
    if (pageSize === 0) return data;
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  // Teaser preview of first 2 rows when collapsed
  const previewData = useMemo(() => {
    return data.slice(0, 2);
  }, [data]);

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
    <div
      id={id}
      className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-sm transition-all scroll-mt-20"
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between p-4 bg-muted/25 border-b border-border/50 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <TableIcon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              {title}
              <span className="text-[11px] font-semibold text-primary font-mono bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                {data.length} periods
              </span>
            </h3>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {/* Controls & Filter Slot */}
        <div className="flex flex-wrap items-center gap-2">
          {filterSlot}

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium"
            title="Download CSV Spreadsheet"
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 gap-1.5 text-xs font-semibold"
          >
            {isExpanded ? (
              <>
                <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Collapse</span>
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5 text-primary" />
                <span className="text-primary">Expand Full</span>
                <ChevronDown className="h-3.5 w-3.5 text-primary" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Table Content */}
      {isExpanded ? (
        <div className="p-4 space-y-3 animate-fade-in">
          <div className="overflow-x-auto rounded-xl border border-border/50">
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

          {/* Table pagination & rows controls */}
          <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-1 gap-2">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-7 text-xs bg-background border border-input rounded px-2 font-sans focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
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
                  className="h-7 px-2.5 text-xs font-medium"
                >
                  Previous
                </Button>
                <span className="px-2 font-mono text-[11px] text-foreground font-semibold">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 px-2.5 text-xs font-medium"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Collapsed Preview Teaser (Never completely blank) */
        <div className="relative p-4 pb-2 bg-card">
          <div className="overflow-x-auto rounded-xl border border-border/40 opacity-70">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold border-b border-border">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`px-3.5 py-2 ${
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      }`}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 font-mono">
                {previewData.map((row, idx) => (
                  <tr key={idx} className="tabular-nums text-foreground/75">
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-3.5 py-1.5 whitespace-nowrap ${
                          col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
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

          {/* Overlay CTA to expand */}
          <div className="absolute inset-x-0 bottom-0 top-10 bg-gradient-to-t from-background via-background/80 to-transparent flex items-end justify-center pb-3">
            <Button
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="h-8 gap-2 text-xs font-bold rounded-xl shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Expand Complete Schedule ({data.length} Periods)</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
