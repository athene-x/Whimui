---
'@athene-x/whimui': patch
---

Form and API error helpers:

- `./form` gains `applySubmitError(formApi, result)`: puts the field errors from `toSubmitError`
  on the form as `onSubmit` errors and returns the form-level message, so every app applies API
  errors to a form the same way.
- `describeError` moves to `./api` next to `ApiError`, with a new `apiErrorCodes(error)` helper.
  `./form` still re-exports `describeError` (deprecated); update imports when convenient.
