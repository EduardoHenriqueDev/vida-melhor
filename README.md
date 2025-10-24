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

2. Crie a tabela `profiles` com RLS habilitado:

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  cpf text not null unique,
  phone text not null,
  role boolean default false,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles select own" on public.profiles
  for select using ( auth.uid() = id );

create policy "Profiles insert own" on public.profiles
  for insert with check ( auth.uid() = id );

create policy "Profiles update own" on public.profiles
  for update using ( auth.uid() = id );
```

## Trigger para auto-criar perfil após cadastro
Se a confirmação de e-mail estiver habilitada, crie um trigger para inserir o perfil quando o usuário é confirmado no auth.users.

```sql
create or replace function public.handle_new_profile()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, cpf, phone, role)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'name',''),
          new.email,
          coalesce(new.raw_user_meta_data->>'cpf',''),
          coalesce(new.raw_user_meta_data->>'phone',''),
          (new.raw_user_meta_data->>'role')::boolean)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_profile();
```

Observações:
- Garanta que a tabela `profiles` esteja com RLS habilitado e as policies de insert/select/update para o próprio usuário.
- Se estiver recebendo 401/403 em operações na tabela `profiles`, verifique:
  1) Se há sessão após `signUp` (quando email confirmation está on, use o trigger acima).
  2) Se as policies permitem a operação com `auth.uid() = id`.
  3) Se o `id` sendo enviado é exatamente `auth.uid()`.

## Permitir cuidadores listarem idosos
Para que usuários marcados como cuidadores consigam visualizar todos os perfis de idosos (role = false) na tela do Cuidador, adicione a seguinte policy na tabela `profiles`:

```sql
create policy "Caregivers can select elderly" on public.profiles
  for select
  using (
    -- Usuário logado é cuidador
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = true
    )
    -- E o registro consultado é de idoso
    and role = false
  );
```

Mantenha também a policy de "select own" já existente para que cada usuário visualize seu próprio registro.
