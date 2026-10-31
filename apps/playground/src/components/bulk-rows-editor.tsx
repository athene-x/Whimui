'use client';

import {
  type BulkIssues,
  type BulkOutcome,
  type BulkRow,
  type BulkTable,
  BULK_CHUNK_SIZE,
  BULK_MAX_ROWS,
  IMPORT_FILE_ACCEPT,
  isBlankBulkRow,
  readImportFile,
  withBulkKeys,
} from '@athenex/web-core/bulk';
import { IconFileImport, IconPlus, IconTrash } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { type ChangeEvent, type ReactNode, useRef, useState } from 'react';

import { AppLink } from '@/components/app-link';
import { FormActions } from '@/components/form/form-actions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const INITIAL_ROWS = 3;

export type BulkCellProps<TValues> = {
  row: BulkRow<TValues>;
  line: number;
  label: string;
  issue?: string;
  disabled: boolean;
  update: (patch: Partial<TValues>) => void;
};

export type BulkColumn<TValues> = {
  field: keyof TValues & string;
  label: string;
  type?: 'email' | 'text';
  render?: (props: BulkCellProps<TValues>) => ReactNode;
};

export type BulkRowsEditorProps<TValues extends Record<string, string>> = {
  columns: readonly BulkColumn<TValues>[];
  emptyValues: () => TValues;
  parseFile: (table: unknown[][]) => BulkTable<TValues>;
  validate: (rows: readonly BulkRow<TValues>[]) => Record<number, BulkIssues<TValues>>;
  submitChunk: (rows: readonly BulkRow<TValues>[]) => Promise<BulkOutcome[]>;
  toRequestError: (error: unknown) => string | undefined;
  templates: { csv: string; xlsx: string };
  description: string;
  doneLabel: string;
  submitLabel: (count: number) => string;
  backHref: string;
  children?: ReactNode;
};

/** Paste-or-import grid that submits rows in chunks and shows each row's outcome. */
export function BulkRowsEditor<TValues extends Record<string, string>>({
  columns,
  emptyValues,
  parseFile,
  validate,
  submitChunk,
  toRequestError,
  templates,
  description,
  doneLabel,
  submitLabel,
  backHref,
  children,
}: BulkRowsEditorProps<TValues>) {
  const t = useTranslations('ui.bulk');
  const tCommon = useTranslations('ui.actions');
  const nextKey = useRef(INITIAL_ROWS);
  const fileInput = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<BulkRow<TValues>[]>(() =>
    withBulkKeys(Array.from({ length: INITIAL_ROWS }, emptyValues), 0),
  );
  const [showIssues, setShowIssues] = useState(false);
  const [outcomes, setOutcomes] = useState<Record<number, BulkOutcome>>({});
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, total: 0 });
  const [fileError, setFileError] = useState<string>();
  const [requestError, setRequestError] = useState<string>();

  const pending = rows.filter((row) => !isBlankBulkRow(row) && outcomes[row.key]?.done !== true);
  const issues = showIssues ? validate(pending) : {};
  const invalidCount = Object.keys(issues).length;
  const done = Object.values(outcomes).filter((outcome) => outcome.done).length;
  const failed = Object.keys(outcomes).length - done;
  const attempted = done + failed > 0;
  const retrying = pending.length > 0 && pending.every((row) => outcomes[row.key] !== undefined);
  const summary = attempted
    ? t('result', { done, failed, total: done + failed })
    : t('ready', { count: pending.length });

  const appendRows = (values: TValues[]) => {
    const start = nextKey.current;
    nextKey.current += values.length;
    setRows((current) => [...current, ...withBulkKeys(values, start)]);
  };

  const updateRow = (key: number, patch: Partial<TValues>) => {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const removeRow = (key: number) => {
    setRows((current) => current.filter((row) => row.key !== key));
  };

  const removeInvalidRows = () => {
    setRows((current) => current.filter((row) => issues[row.key] === undefined));
  };

  const selectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setFileError(undefined);

    if (!file) return;

    try {
      const table = parseFile(await readImportFile(file));

      if (table.error !== undefined) {
        setFileError(table.error);
        return;
      }

      const filled = rows.filter((row) => !isBlankBulkRow(row));

      if (filled.length + table.rows.length > BULK_MAX_ROWS) {
        setFileError(t('tooManyRows', { max: BULK_MAX_ROWS }));
        return;
      }

      setRows(filled);
      appendRows(table.rows);
      setShowIssues(true);
    } catch {
      setFileError(t('readFailed'));
    }
  };

  const submit = async () => {
    setShowIssues(true);
    setRequestError(undefined);

    if (pending.length === 0) return;
    if (Object.keys(validate(pending)).length > 0) return;

    setSubmitting(true);
    setProgress({ processed: 0, total: pending.length });

    for (let start = 0; start < pending.length; start += BULK_CHUNK_SIZE) {
      const chunk = pending.slice(start, start + BULK_CHUNK_SIZE);

      try {
        const results = await submitChunk(chunk);

        setOutcomes((current) => {
          const next = { ...current };
          chunk.forEach((row, index) => {
            next[row.key] = results[index] ?? { done: false, message: t('noResult') };
          });
          return next;
        });
        setProgress({ processed: start + chunk.length, total: pending.length });
      } catch (error) {
        setRequestError(toRequestError(error));
        break;
      }
    }

    setSubmitting(false);
  };

  return (
    <div className="@container flex w-full flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        {description}{' '}
        {t.rich('downloadTemplates', {
          csv: (chunks) => <TemplateLink href={templates.csv}>{chunks}</TemplateLink>,
          xlsx: (chunks) => <TemplateLink href={templates.xlsx}>{chunks}</TemplateLink>,
        })}
      </p>
      {fileError && (
        <Alert variant="destructive">
          <AlertDescription>{fileError}</AlertDescription>
        </Alert>
      )}
      {requestError && (
        <Alert variant="destructive">
          <AlertDescription>
            {requestError} {t('stopped', progress)}
          </AlertDescription>
        </Alert>
      )}
      <div className="overflow-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-0">{t('line')}</TableHead>
              {columns.map((column) => (
                <TableHead key={column.field}>{column.label}</TableHead>
              ))}
              <TableHead>{t('outcome')}</TableHead>
              <TableHead className="w-0">
                <span className="sr-only">{t('actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => {
              const line = index + 1;
              const outcome = outcomes[row.key];
              const locked = submitting || outcome?.done === true;

              return (
                <TableRow key={row.key}>
                  <TableCell className="text-muted-foreground">{line}</TableCell>
                  {columns.map((column) => {
                    const cell: BulkCellProps<TValues> = {
                      row,
                      line,
                      label: column.label,
                      issue: issues[row.key]?.[column.field],
                      disabled: locked,
                      update: (patch) => updateRow(row.key, patch),
                    };

                    return (
                      <TableCell key={column.field} className="align-top">
                        {column.render ? (
                          column.render(cell)
                        ) : (
                          <BulkTextCell {...cell} field={column.field} type={column.type} />
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell className="whitespace-normal">
                    <RowOutcome outcome={outcome} waiting={submitting} doneLabel={doneLabel} />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      aria-label={t('removeRow', { line })}
                      disabled={locked}
                      onClick={() => removeRow(row.key)}
                    >
                      <IconTrash />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={submitting || rows.length >= BULK_MAX_ROWS}
          onClick={() => appendRows([emptyValues()])}
        >
          <IconPlus /> {t('addRow')}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={submitting}
          onClick={() => fileInput.current?.click()}
        >
          <IconFileImport /> {t('importFromFile')}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept={IMPORT_FILE_ACCEPT}
          aria-label={t('fileLabel')}
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => void selectFile(event)}
        />
        {invalidCount > 0 && (
          <Button type="button" variant="outline" disabled={submitting} onClick={removeInvalidRows}>
            {t('removeInvalid', { count: invalidCount })}
          </Button>
        )}
      </div>
      {children}
      <p className="text-sm text-muted-foreground" role="status">
        {summary}
        {invalidCount > 0 && ` ${t('fixIssues', { count: invalidCount })}`}
      </p>
      {attempted && pending.length === 0 && (
        <Alert>
          <AlertDescription>{t('allDone')}</AlertDescription>
        </Alert>
      )}
      <FormActions>
        <Button
          type="button"
          variant="outline"
          disabled={submitting}
          nativeButton={false}
          render={<AppLink href={backHref} replace />}
        >
          {attempted ? tCommon('back') : tCommon('cancel')}
        </Button>
        <Button
          type="button"
          disabled={submitting || pending.length === 0}
          aria-busy={submitting}
          onClick={() => void submit()}
        >
          {submitting
            ? t('submitting', progress)
            : retrying
              ? t('retry', { count: pending.length })
              : submitLabel(pending.length)}
        </Button>
      </FormActions>
    </div>
  );
}

export function BulkCell({ issue, children }: { issue?: string; children: ReactNode }) {
  return (
    <div className="flex min-w-40 flex-col gap-1">
      {children}
      {issue && <p className="text-xs text-destructive">{issue}</p>}
    </div>
  );
}

export function useBulkCellLabel() {
  const t = useTranslations('ui.bulk');
  return (label: string, line: number) => t('cellLabel', { column: label, line });
}

type BulkTextCellProps<TValues> = BulkCellProps<TValues> & {
  field: keyof TValues & string;
  type?: 'email' | 'text';
};

function BulkTextCell<TValues extends Record<string, string>>({
  row,
  line,
  label,
  issue,
  disabled,
  update,
  field,
  type = 'text',
}: BulkTextCellProps<TValues>) {
  const cellLabel = useBulkCellLabel();

  return (
    <BulkCell issue={issue}>
      <Input
        type={type}
        value={row[field]}
        aria-label={cellLabel(label, line)}
        aria-invalid={issue !== undefined}
        autoComplete="off"
        disabled={disabled}
        onChange={(event) => update({ [field]: event.target.value } as Partial<TValues>)}
      />
    </BulkCell>
  );
}

function TemplateLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} download className="font-medium text-foreground underline underline-offset-4">
      {children}
    </a>
  );
}

function RowOutcome({
  outcome,
  waiting,
  doneLabel,
}: {
  outcome?: BulkOutcome;
  waiting: boolean;
  doneLabel: string;
}) {
  const t = useTranslations('ui.bulk');

  if (!outcome) {
    return <span className="text-muted-foreground">{waiting ? t('waiting') : '-'}</span>;
  }

  if (outcome.done) return <Badge className="bg-green-600">{doneLabel}</Badge>;

  return <span className="text-destructive">{outcome.message}</span>;
}
