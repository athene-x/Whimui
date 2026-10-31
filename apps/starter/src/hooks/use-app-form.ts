'use client';

import { fieldContext, formContext } from '@athenex/web-core/form';
import { createFormHook } from '@tanstack/react-form';

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {},
  formComponents: {},
});
