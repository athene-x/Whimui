import { ApiLabScreen } from '@/features/api-lab';
import { env } from '@/lib/env';
import { getSession } from '@/lib/session';

export default async function ApiLabPage() {
  const session = await getSession();
  return <ApiLabScreen loggedIn={session !== null} audience={env().API_AUDIENCE} />;
}
