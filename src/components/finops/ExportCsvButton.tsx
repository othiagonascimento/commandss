import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { downloadCSV, toCSV } from '@/lib/finops/format';

interface Props {
  filename: string;
  rows: Record<string, unknown>[];
  headers?: { key: string; label: string }[];
  disabled?: boolean;
}

export function ExportCsvButton({ filename, rows, headers, disabled }: Props) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      disabled={disabled || !rows.length}
      onClick={() => downloadCSV(filename, toCSV(rows, headers))}
    >
      <Download className="h-3.5 w-3.5" /> CSV
    </Button>
  );
}
