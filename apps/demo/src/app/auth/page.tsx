import { AuthPanel } from '@/features/auth';
import { getAuthOverview } from '@/features/auth/server';

type AuthPageProps = { searchParams: Promise<{ ended?: string }> };

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const [overview, { ended }] = await Promise.all([getAuthOverview(), searchParams]);
  return <AuthPanel {...overview} ended={ended} />;
}
