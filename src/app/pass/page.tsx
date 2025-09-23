"use client";

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function PassForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const to = searchParams.get('from') || '/';
        router.replace(to);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({ error: 'Fehlerhafte Eingabe' }));
        setError(data.error || 'Ungültiges Passwort');
      }
    } catch (err) {
      setError('Unerwarteter Fehler. Bitte erneut versuchen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Passwort"
        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        autoFocus
        required
      />
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg"
      >
        {loading ? 'Prüfe…' : 'Freischalten'}
      </button>
    </form>
  );
}

export default function PasswordGatePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Zugang erforderlich</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Bitte Passwort eingeben, um die Seite zu öffnen.</p>
        <Suspense>
          <PassForm />
        </Suspense>
      </div>
    </div>
  );
}


