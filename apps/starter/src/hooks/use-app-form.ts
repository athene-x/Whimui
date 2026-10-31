'use client';

import { fieldContext, formContext } from '@athene-x/whimui/form';
import { createFormHook } from '@tanstack/react-form';

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {},
  formComponents: {},
});
