<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Netlify hosting

- Framework: TanStack Start + Supabase (auth, Postgres, RLS). Data lives in Supabase — do not migrate it to another store.
- `vite.config.ts` uses the standard TanStack Start plugins plus `@netlify/vite-plugin-tanstack-start` (it replaced Lovable's Cloudflare/nitro config). `src/server.ts` is the custom server entry (SSR error wrapper + security headers).
- Server functions live in `src/lib/*.functions.ts`; read `process.env` inside handlers, not at module scope.
- Server Supabase clients fall back to `VITE_SUPABASE_*` (from `.env`) when `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY` aren't set. `SUPABASE_SERVICE_ROLE_KEY` must be set in Netlify env vars.
- AI (`src/lib/ai-gateway.server.ts`) goes through Netlify AI Gateway via `@ai-sdk/openai`; only use models from the gateway's supported list.
- Package manager is npm (the Bun lockfile was removed).
