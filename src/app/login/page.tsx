import AuthShell from '@/components/AuthShell';
import LoginForm from '@/components/LoginForm';

type LoginPageProps = {
  searchParams: Promise<{ reason?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { reason } = await searchParams;
  const initialError = reason === 'session-expired' ? 'Tu sesión ha expirado.' : null;

  return (
    <AuthShell>
      <LoginForm initialError={initialError} />
    </AuthShell>
  );
}
