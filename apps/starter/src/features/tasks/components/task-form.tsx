'use client';

import { toSubmitError } from '@athenex/web-core/form';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useAppForm } from '@/hooks/use-app-form';

import { saveTaskMutation } from '../queries';
import { taskInputSchema, type Task } from '../schemas';

export function TaskForm({ task, onClose }: { task?: Task; onClose: () => void }) {
  const t = useTranslations('tasks');
  const mutation = useMutation(saveTaskMutation());
  const [submitError, setSubmitError] = useState<string>();
  const form = useAppForm({
    defaultValues: { title: task?.title ?? '', completed: task?.completed ?? false },
    validators: { onChange: taskInputSchema },
    onSubmit: async ({ value }) => {
      setSubmitError(undefined);
      try {
        await mutation.mutateAsync({ id: task?.id, input: taskInputSchema.parse(value) });
        onClose();
      } catch (error) {
        const result = toSubmitError<'title'>(error, t('failed'), {
          'Tasks.DuplicateTitle': { field: 'title', message: t('duplicate') },
          'Tasks.InvalidInput': { field: 'title', message: t('invalidTitle') },
        });
        if (result.fields?.title) {
          form.setFieldMeta('title', (meta) => ({
            ...meta,
            isTouched: true,
            errorMap: { ...meta.errorMap, onSubmit: result.fields.title },
          }));
        } else {
          setSubmitError(result.message);
        }
      }
    },
  });

  return (
    <form
      className="panel"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <h2>{task ? t('edit') : t('add')}</h2>
      <form.Field name="title">
        {(field) => {
          const invalid = field.state.meta.isTouched && !field.state.meta.isValid;
          const serverError = field.state.meta.errorMap.onSubmit;
          return (
            <div className="field">
              <label htmlFor="task-title">{t('name')}</label>
              <input
                id="task-title"
                value={field.state.value}
                maxLength={120}
                required
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                aria-invalid={invalid}
                aria-describedby={invalid ? 'title-error' : undefined}
              />
              {invalid && (
                <p id="title-error" role="alert">
                  {typeof serverError === 'string' ? serverError : t('invalidTitle')}
                </p>
              )}
            </div>
          );
        }}
      </form.Field>
      <form.Field name="completed">
        {(field) => (
          <label className="actions">
            <input
              type="checkbox"
              checked={field.state.value}
              onChange={(event) => field.handleChange(event.target.checked)}
            />
            {t('completed')}
          </label>
        )}
      </form.Field>
      {submitError && <p role="alert">{submitError}</p>}
      <div className="actions">
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? t('saving') : t('save')}
            </button>
          )}
        </form.Subscribe>
        <button type="button" onClick={onClose} disabled={mutation.isPending}>
          {t('cancel')}
        </button>
      </div>
    </form>
  );
}
