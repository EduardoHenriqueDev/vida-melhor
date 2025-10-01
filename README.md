# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

# Configuração Supabase

1. Crie um projeto no Supabase e copie a URL e a chave ANON para `.env.local`:

```
VITE_SUPABASE_URL=xxxx
VITE_SUPABASE_ANON_KEY=xxxx
```

2. Crie a tabela `users` com RLS habilitado:

```sql
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  cpf text not null unique,
  phone text not null,
  created_at timestamptz default now()
);

alter table public.users enable row level security;

-- Usuário autenticado pode ver e editar apenas seu próprio registro
create policy "Users can view own profile" on public.users
for select using ( auth.uid() = id );

create policy "Users can insert own profile" on public.users
for insert with check ( auth.uid() = id );

create policy "Users can update own profile" on public.users
for update using ( auth.uid() = id );
```

## Trigger para auto-criar perfil após cadastro
Se a confirmação de e-mail estiver habilitada, crie um trigger para inserir o perfil quando o usuário é confirmado no auth.users.

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email, cpf, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'name',''), new.email, coalesce(new.raw_user_meta_data->>'cpf',''), coalesce(new.raw_user_meta_data->>'phone',''))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- dispara ao inserir no auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

Observações:
- Garanta que a tabela `users` esteja com RLS habilitado e as policies de insert/select/update para o próprio usuário (como acima).
- Se estiver recebendo 401 em `insert` na tabela `users`, verifique:
  1) Se há sessão após `signUp` (quando email confirma está on, normalmente não há). Use o trigger acima.
  2) Se as policies permitem `insert` pelo `anon` com `auth.uid() = id` (a chave anon autentica o usuário logado).
  3) Se o `id` que você insere é exatamente `auth.uid()`.
