// TODO: After `pnpm install`, extend with `eslint-config-next` flat config (Next.js 15).

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "dist/**"],
  },
];
