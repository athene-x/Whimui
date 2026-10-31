import type { ListQuery } from '@whimui/core/list-query';

import { IconSearch } from '@tabler/icons-react';

import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';

export type ListSearchInputProps = {
  list: Pick<ListQuery, 'searchInput' | 'setSearchInput'>;
  label: string;
  placeholder?: string;
  className?: string;
};

/** Debounced free-text search bound to a `useListQuery` (the API's `searchTerm`). */
export function ListSearchInput({
  list,
  label,
  placeholder = label,
  className,
}: ListSearchInputProps) {
  return (
    <InputGroup className={className}>
      <InputGroupAddon>
        <IconSearch />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={list.searchInput}
        onChange={(event) => list.setSearchInput(event.target.value)}
      />
    </InputGroup>
  );
}
