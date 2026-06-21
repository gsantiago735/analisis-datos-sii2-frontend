import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-xl border border-gray-100">
        <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-2">Bienvenido</h1>
        <p className="text-gray-500 text-center mb-8">Inicia sesión en tu cuenta para continuar</p>
        
        <LoginForm />
      </div>
    </div>
  );
}
