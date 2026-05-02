import { Card } from '@/components/ui/card';
import { Database } from 'lucide-react';

interface Props {
  title?: string;
  description?: string;
}

export function EmptyFinOpsState({
  title = 'Sem logs econômicos ainda',
  description = 'Pode ser que o deploy das functions de telemetria não tenha sido feito ou ainda não houve chamadas IA neste período.',
}: Props) {
  return (
    <Card className="p-10 flex flex-col items-center text-center gap-3 border-dashed">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
        <Database className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">{description}</p>
    </Card>
  );
}
