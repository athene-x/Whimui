import type { MutationFunctionContext, QueryKey } from '@tanstack/react-query';

export function invalidateOnSuccess(...queryKeys: QueryKey[]) {
  return async (
    _data: unknown,
    _variables: unknown,
    _onMutateResult: unknown,
    { client }: MutationFunctionContext,
  ): Promise<void> => {
    await Promise.all(queryKeys.map((queryKey) => client.invalidateQueries({ queryKey })));
  };
}
