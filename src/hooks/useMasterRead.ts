import { useEffect, useRef } from 'react';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  parseMasterRead,
  type MasterReadEnvelope,
  type MasterReadMeta,
} from '@/lib/masterContract';

// CRM project id for fallback meta (matches memory: External DB Mandate)
const CRM_PROJECT_ID = 'btoyclznuuwvxbsacemw';

// Module-level set so we toast each (widget) at most once per session
const toastedWidgets = new Set<string>();

interface Args<T> {
  /** Stable widget identifier — used for telemetry + toast dedupe. */
  widget: string;
  /** TanStack queryKey */
  queryKey: readonly unknown[];
  /** Fetcher returning raw response from edge function (v2 envelope OR legacy v1). */
  queryFn: () => Promise<unknown>;
  /** Zod schema validating the inner `data` payload. */
  dataSchema: z.ZodType<T>;
  /** Optional standard react-query overrides. */
  options?: Omit<UseQueryOptions<MasterReadEnvelope<T>, Error>, 'queryKey' | 'queryFn'>;
}

export interface UseMasterReadResult<T> {
  envelope: MasterReadEnvelope<T> | null;
  data: T | null;
  meta: MasterReadMeta | null;
  isLoading: boolean;
  isFetching: boolean;
  /** Schema mismatch — UI should render an error state. */
  schemaInvalid: boolean;
  schemaError: z.ZodError | null;
  error: Error | null;
  refetch: () => void;
}

export function useMasterRead<T>({
  widget,
  queryKey,
  queryFn,
  dataSchema,
  options,
}: Args<T>): UseMasterReadResult<T> {
  const schemaErrRef = useRef<z.ZodError | null>(null);

  const query = useQuery<MasterReadEnvelope<T>, Error>({
    queryKey,
    queryFn: async () => {
      const raw = await queryFn();
      const parsed = parseMasterRead<T>(raw, {
        dataSchema,
        widget,
        sourceProjectId: CRM_PROJECT_ID,
      });
      if (!parsed.ok || !parsed.envelope) {
        schemaErrRef.current = parsed.schemaError;
        throw new SchemaError(widget, parsed.schemaError);
      }
      schemaErrRef.current = null;
      return parsed.envelope;
    },
    ...options,
  });

  // Toast 1x por sessão por widget quando schema falha
  useEffect(() => {
    if (query.error instanceof SchemaError && !toastedWidgets.has(widget)) {
      toastedWidgets.add(widget);
      toast.error(`Contrato inválido em "${widget}"`, {
        description: 'A resposta da API não bate com o formato esperado. O widget está em estado de erro.',
        duration: 8000,
      });
      // eslint-disable-next-line no-console
      console.error(`[useMasterRead] Schema violation in "${widget}"`, query.error.zodError?.flatten());
    }
  }, [query.error, widget]);

  return {
    envelope: query.data ?? null,
    data: query.data?.data ?? null,
    meta: query.data?.meta ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    schemaInvalid: query.error instanceof SchemaError,
    schemaError: query.error instanceof SchemaError ? query.error.zodError : null,
    error: query.error instanceof SchemaError ? null : query.error,
    refetch: query.refetch,
  };
}

export class SchemaError extends Error {
  constructor(public widget: string, public zodError: z.ZodError | null) {
    super(`Schema mismatch for widget '${widget}'`);
    this.name = 'SchemaError';
  }
}
