# @whimui/registry

## 0.3.0

### Minor Changes

- 6fcf83d: `useFieldControl` and `FormFieldProps` move from the registry's `form-field.tsx` into
  `@athene-x/whimui/form`, so the id and aria wiring of every field component comes from the kit.
  `form-field.tsx` keeps re-exporting both; field components need no change, but the `form`
  registry item now requires a kit version that ships them.
  
  The `feedback` item's `load-error.tsx` now reads its message with `describeError` from
  `@athene-x/whimui/api` instead of `toSubmitError(...).message`; the rendered text is unchanged.

## 0.2.0

### Minor Changes

- Pin the registry to `@athene-x/whimui` 0.2.0: `query-provider` now uses `getQueryClient`
  from the new `./query` entry, so items require that core version or later.
