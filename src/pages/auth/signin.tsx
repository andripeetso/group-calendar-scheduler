import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/router";

export default function SignIn() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn("credentials", {
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Vale parool");
    } else {
      router.push("/admin");
    }
  };

  return (
    <div className="min-h-screen bg-transparent py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-gray-900 rounded-lg shadow-2xl border border-yellow-500/20 p-6">
          <h1 className="text-2xl font-bold text-yellow-400 mb-6">
            Admin Login
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sisesta parool"
                className="w-full bg-gray-800 text-gray-300 rounded-lg px-4 py-2 border border-gray-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
              />
            </div>
            {error && <div className="text-red-400 text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors font-bold"
            >
              Logi sisse
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
