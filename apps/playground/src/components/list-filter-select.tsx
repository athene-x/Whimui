import type { ListQuery } from '@athene-x/whimui/list-query';

import { FilterSelect, type FilterSelectProps } from '@/components/filter-select';

export type ListFilterSelectProps<TField extends string> = Omit<
  FilterSelectProps,
  'value' | 'onChange'
> & {
  list: Pick<ListQuery<string, TField>, 'getFilter' | 'setFilter'>;
  field: TField;
};

/** Single-value filter bound to a `useListQuery` field (sent as `field:in:value`). */
export function ListFilterSelect<TField extends string>({
  list,
  field,
  ...props
}: ListFilterSelectProps<TField>) {
  return (
    <FilterSelect
      {...props}
      value={list.getFilter(field)[0] ?? ''}
      onChange={(value) => list.setFilter(field, value ? [value] : [])}
    />
  );
}
