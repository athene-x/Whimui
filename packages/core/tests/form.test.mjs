import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

registerHooks({
  resolve(specifier, context, nextResolve) {
    const local = specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier);
    return nextResolve(local ? `${specifier}.ts` : specifier, context);
  },
});

const { ApiError, apiErrorBody } = await import('../src/api/api.ts');
const { apiErrorCodes, describeError } = await import('../src/api/api-errors.ts');
const { applySubmitError, toSubmitError } = await import('../src/form/form-errors.ts');
const formEntry = await import('../src/form/form-errors.ts');
const { describedBy, isFieldInvalid, toFieldErrors } = await import('../src/form/field-state.ts');

const withDetails = (code, description, errors) =>
  new ApiError(400, { code, description, errors });

test('toSubmitError maps the top-level code, then detail codes, first rule per field wins', () => {
  const error = withDetails('Tasks.InvalidInput', 'The input is invalid.', [
    { code: 'Tasks.TitleRequired', description: 'Title is required.', field: 'title' },
    { code: 'Tasks.TitleTooLong', description: 'Title is too long.', field: 'title' },
    { code: 'Tasks.DueInPast', description: 'Due date has passed.', field: 'dueAt' },
  ]);
  const rules = {
    'Tasks.TitleRequired': { field: 'title', message: 'Enter a title' },
    'Tasks.TitleTooLong': { field: 'title', message: 'Shorten the title' },
    'Tasks.DueInPast': { field: 'dueAt', message: 'Pick a future date' },
  };
  assert.deepEqual(toSubmitError(error, 'Unexpected', rules), {
    fields: { title: 'Enter a title', dueAt: 'Pick a future date' },
  });

  const topLevel = new ApiError(409, apiErrorBody('Tasks.DuplicateTitle', 'Exists.'));
  assert.deepEqual(
    toSubmitError(topLevel, 'Unexpected', {
      'Tasks.DuplicateTitle': { field: 'title', message: 'Already used' },
    }),
    { fields: { title: 'Already used' } },
  );
});

test('toSubmitError falls back to the description, then the unexpected message', () => {
  const described = new ApiError(409, apiErrorBody('Tasks.Conflict', 'Taken.'));
  assert.deepEqual(toSubmitError(described, 'Unexpected'), { message: 'Taken.' });
  assert.deepEqual(toSubmitError(described, 'Unexpected', { Other: { field: 'x', message: 'y' } }), {
    message: 'Taken.',
  });

  const blank = new ApiError(500, apiErrorBody('Web.UnexpectedResponse', ''));
  assert.deepEqual(toSubmitError(blank, 'Unexpected'), { message: 'Unexpected' });
  assert.deepEqual(toSubmitError(new TypeError('boom'), 'Unexpected'), { message: 'Unexpected' });
  assert.deepEqual(toSubmitError(undefined, 'Unexpected'), { message: 'Unexpected' });
});

test('toSubmitError ignores prototype keys as codes', () => {
  const error = new ApiError(400, apiErrorBody('constructor', 'Odd code.'));
  assert.deepEqual(toSubmitError(error, 'Unexpected'), { message: 'Odd code.' });
  assert.deepEqual(toSubmitError(error, 'Unexpected', { toString: { field: 'a', message: 'b' } }), {
    message: 'Odd code.',
  });
});

test('applySubmitError puts field errors on the form and returns a form-level message', () => {
  const calls = [];
  const form = { setErrorMap: (map) => calls.push(map) };

  assert.equal(applySubmitError(form, { fields: { title: 'Already used' } }), undefined);
  assert.deepEqual(calls, [{ onSubmit: { fields: { title: 'Already used' } } }]);

  assert.equal(applySubmitError(form, { message: 'Could not save.' }), 'Could not save.');
  assert.equal(calls.length, 1);
});

test('apiErrorCodes lists the envelope code first, then detail codes in order', () => {
  assert.deepEqual(apiErrorCodes(new ApiError(409, apiErrorBody('A', ''))), ['A']);
  assert.deepEqual(
    apiErrorCodes(
      withDetails('A', '', [
        { code: 'B', description: '', field: null },
        { code: 'C', description: '', field: 'x' },
      ]),
    ),
    ['A', 'B', 'C'],
  );
  assert.equal(formEntry.describeError, describeError, 'still re-exported from ./form');
});

test('describeError prefers a mapped code, then the description, then the fallback', () => {
  const error = withDetails('Tasks.InvalidInput', 'The input is invalid.', [
    { code: 'Tasks.TitleRequired', description: 'Title is required.', field: 'title' },
  ]);
  assert.equal(describeError(error, { 'Tasks.TitleRequired': 'Enter a title' }), 'Enter a title');
  assert.equal(
    describeError(error, { 'Tasks.InvalidInput': 'Fix the form', 'Tasks.TitleRequired': 'Title' }),
    'Fix the form',
  );
  assert.equal(describeError(error), 'The input is invalid.');
  assert.equal(
    describeError(new ApiError(500, apiErrorBody('Web.UnexpectedResponse', '')), {}, 'Fallback'),
    'Fallback',
  );
  assert.equal(describeError(new TypeError('x'), { x: 'y' }, 'Fallback'), 'Fallback');
  assert.equal(describeError(null), 'Something went wrong. Please try again.');
});

test('field-state helpers: invalid only once touched, message shapes, aria-describedby ids', () => {
  assert.equal(isFieldInvalid({ isTouched: false, isValid: false }), false);
  assert.equal(isFieldInvalid({ isTouched: true, isValid: true }), false);
  assert.equal(isFieldInvalid({ isTouched: true, isValid: false }), true);

  assert.deepEqual(
    toFieldErrors(['Required', { message: 'Too long', path: ['title'] }, { code: 'x' }, null, 3]),
    [{ message: 'Required' }, { message: 'Too long' }],
  );

  assert.equal(describedBy('email', { hasDescription: false, invalid: false }), undefined);
  assert.equal(describedBy('email', { hasDescription: true, invalid: false }), 'email-description');
  assert.equal(describedBy('email', { hasDescription: false, invalid: true }), 'email-error');
  assert.equal(
    describedBy('email', { hasDescription: true, invalid: true }),
    'email-description email-error',
  );
});
