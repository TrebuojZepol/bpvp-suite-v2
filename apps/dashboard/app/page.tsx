import { AuthForm } from "@/components/forms/AuthForm";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bpvp-bg px-4 py-16 transition-all duration-150 ease-out">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-bpvp-text-primary">BPVP</h1>
        <p className="mt-2 text-sm text-bpvp-text-secondary">
          Institutional dashboard — Bitcoin-native markets.
        </p>
      </div>
      <AuthForm />
    </div>
  );
}
