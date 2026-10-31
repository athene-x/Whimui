import { CHECKBOX_GROUP_LAYOUTS, groupOptions } from '@/components/form/checkbox-group-options';
import { Checkbox } from '@/components/ui/checkbox';
import { FieldDescription, FieldLabel } from '@/components/ui/field';

export type PermissionOption = {
  value: string;
  label: string;
  description?: string;
  group?: string;
};

export type PermissionGridProps = {
  idPrefix: string;
  options: readonly PermissionOption[];
  granted: readonly string[];
};

/** Read-only view of a role's permissions, laid out like the role form's checkbox grid. */
export function PermissionGrid({ idPrefix, options, granted }: PermissionGridProps) {
  return (
    <div className={CHECKBOX_GROUP_LAYOUTS.grid.groups}>
      {groupOptions(options).map((group) => (
        <div key={group.name} className={CHECKBOX_GROUP_LAYOUTS.grid.group}>
          <p className="text-sm font-medium text-muted-foreground">{group.name}</p>
          {group.options.map((option) => {
            const optionId = `${idPrefix}-${option.value}`;

            return (
              <div key={option.value} className="flex items-start gap-2">
                <Checkbox
                  id={optionId}
                  className="mt-0.5"
                  checked={granted.includes(option.value)}
                  disabled
                />
                <div className="flex flex-col gap-0.5">
                  <FieldLabel htmlFor={optionId}>{option.label}</FieldLabel>
                  {option.description && (
                    <FieldDescription className="text-xs">{option.description}</FieldDescription>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
