'use client';

import { useFieldContext } from '@athenex/web-core/form';
import { useTranslations } from 'next-intl';
import { useState, type ComponentProps, type ReactNode } from 'react';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { InputGroupAddon } from '@/components/ui/input-group';

import { FormField, useFieldControl, type FormFieldProps } from './form-field';

export type ComboboxOption = { value: string; label: string; disabled?: boolean };
export type ComboboxFieldProps<TOption extends ComboboxOption = ComboboxOption> = FormFieldProps &
  Pick<
    ComponentProps<typeof ComboboxInput>,
    'placeholder' | 'disabled' | 'className' | 'autoComplete' | 'showClear'
  > & {
    options: readonly TOption[];
    // Supply the current option when editing a value outside the fetched results.
    selectedOption?: TOption;
    renderOption?: (option: TOption) => ReactNode;
    leading?: (selected: TOption | null) => ReactNode;
    emptyText?: ReactNode;
    loadingText?: ReactNode;
    loading?: boolean;
    searchError?: ReactNode;
    hasMore?: boolean;
    loadingMore?: boolean;
    loadingMoreText?: ReactNode;
    onLoadMore?: () => void;
  } & (
    | { mode?: 'client'; onSearchChange?: (search: string) => void }
    | { mode: 'server'; onSearchChange: (search: string) => void }
  );

const LOAD_MORE_DISTANCE_PX = 48;

export function ComboboxField<TOption extends ComboboxOption = ComboboxOption>(
  props: ComboboxFieldProps<TOption>,
) {
  const t = useTranslations('ui.combobox');
  const field = useFieldContext<string>();
  const { fieldProps, controlProps, inputProps } = useFieldControl(props);
  const {
    options,
    selectedOption,
    renderOption,
    leading,
    mode = 'client',
    onSearchChange,
    emptyText,
    loadingText,
    loading = false,
    searchError,
    hasMore = false,
    loadingMore = false,
    loadingMoreText,
    onLoadMore,
    ...comboboxInputProps
  } = inputProps;
  const [lastSelection, setLastSelection] = useState<TOption | null>(null);
  const value = field.state.value;
  const selected =
    options.find((option) => option.value === value) ??
    (selectedOption?.value === value ? selectedOption : undefined) ??
    (lastSelection?.value === value ? lastSelection : undefined) ??
    (value ? ({ value, label: value } as TOption) : null);

  return (
    <FormField {...fieldProps}>
      <Combobox
        items={loading || searchError ? [] : options}
        value={selected}
        disabled={comboboxInputProps.disabled}
        filter={mode === 'server' ? null : undefined}
        itemToStringLabel={(option: TOption) => option.label}
        itemToStringValue={(option: TOption) => option.value}
        isItemEqualToValue={(option, current) => option.value === current.value}
        onInputValueChange={(search, details) => {
          if (
            details.reason === 'input-change' ||
            details.reason === 'input-clear' ||
            details.reason === 'clear-press'
          )
            onSearchChange?.(search);
        }}
        onValueChange={(option) => {
          setLastSelection(option);
          field.handleChange(option?.value ?? '');
        }}
      >
        <ComboboxInput
          showClear
          {...comboboxInputProps}
          {...controlProps}
          aria-busy={loading}
          onBlur={field.handleBlur}
        >
          {leading && <InputGroupAddon>{leading(selected)}</InputGroupAddon>}
        </ComboboxInput>
        <ComboboxContent>
          {loading || searchError ? (
            <div
              className="px-3 py-2 text-sm text-muted-foreground"
              role={searchError ? 'alert' : 'status'}
            >
              {searchError || loadingText || t('loading')}
            </div>
          ) : (
            <>
              <ComboboxEmpty>{emptyText ?? t('empty')}</ComboboxEmpty>
              <ComboboxList
                onScroll={(event) => {
                  const list = event.currentTarget;
                  const remaining = list.scrollHeight - list.scrollTop - list.clientHeight;
                  if (hasMore && !loadingMore && remaining < LOAD_MORE_DISTANCE_PX) onLoadMore?.();
                }}
              >
                {(option: TOption) => (
                  <ComboboxItem key={option.value} value={option} disabled={option.disabled}>
                    {renderOption ? renderOption(option) : option.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
              {loadingMore && (
                <div className="px-3 py-2 text-sm text-muted-foreground" role="status">
                  {loadingMoreText ?? t('loadingMore')}
                </div>
              )}
            </>
          )}
        </ComboboxContent>
      </Combobox>
    </FormField>
  );
}
