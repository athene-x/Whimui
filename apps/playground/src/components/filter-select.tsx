import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

export type FilterOption = {
  value: string;
  label: string;
};

export type FilterSelectProps = {
  label: string;
  allLabel: string;
  options: readonly FilterOption[] | undefined;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

/** Single-value filter as a native `<select>`, with an "all" option that clears it. */
export function FilterSelect({
  label,
  allLabel,
  options,
  value,
  onChange,
  className,
}: FilterSelectProps) {
  return (
    <NativeSelect
      className={className}
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <NativeSelectOption value="">{allLabel}</NativeSelectOption>
      {options?.map((option) => (
        <NativeSelectOption key={option.value} value={option.value}>
          {option.label}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
