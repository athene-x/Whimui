export type OptionGroup<TOption> = {
  name: string | undefined;
  options: TOption[];
};

export function groupOptions<TOption extends { group?: string }>(
  options: readonly TOption[],
): OptionGroup<TOption>[] {
  const groups = new Map<string | undefined, TOption[]>();

  for (const option of options) {
    const group = groups.get(option.group);
    if (group) group.push(option);
    else groups.set(option.group, [option]);
  }

  return Array.from(groups, ([name, groupedOptions]) => ({ name, options: groupedOptions }));
}

export type CheckboxGroupLayout = 'list' | 'grid';

export const CHECKBOX_GROUP_LAYOUTS = {
  list: {
    groups: 'flex w-full flex-col gap-5',
    group: 'flex flex-col gap-3',
  },
  grid: {
    groups: 'grid w-full gap-4 @3xl:grid-cols-2 @5xl:grid-cols-3 @7xl:grid-cols-4',
    group: 'flex flex-col gap-3 rounded-lg border p-4',
  },
} satisfies Record<CheckboxGroupLayout, { groups: string; group: string }>;
