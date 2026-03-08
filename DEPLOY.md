# Deploy na VPS com Easy Panel + GitHub

## 1. Subir o projeto no GitHub

1. Crie um repositório no GitHub (ex.: `convite`).
2. Na pasta do projeto, inicie o Git (se ainda não tiver) e envie o código:

```bash
git init
git add .
git commit -m "App convites pronto para deploy"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/convite.git
git push -u origin main
```

## 2. Banco de dados (PostgreSQL)

Na VPS ou em um serviço externo, tenha um PostgreSQL rodando. Crie um banco e anote a **connection string**:

```
postgresql://usuario:senha@host:5432/nome_do_banco
```

Depois rode as migrações (uma vez):

- `server/scripts/001-auth-and-owners.sql` — tabela `users` e donos das festas
- `server/scripts/002-gift-list.sql` — lista de presentes

E crie pelo menos um usuário:

```bash
cd server
node scripts/create-user.js admin SUA_SENHA true
```

(Use a mesma `DATABASE_URL` no `.env` do server ao rodar o script.)

## 3. Easy Panel na VPS

1. Conecte o Easy Panel à sua VPS e ao GitHub.
2. Crie um **novo app** e escolha **GitHub** como origem.
3. Selecione o repositório do projeto (ex.: `convite`).
4. O Easy Panel deve detectar o **Dockerfile** na raiz. Confirme que o build usa esse Dockerfile.
5. Configure as **variáveis de ambiente** do container:

| Variável       | Valor                                                                 |
|----------------|-----------------------------------------------------------------------|
| `DATABASE_URL` | `postgresql://usuario:senha@host:5432/nome_do_banco`                  |
| `JWT_SECRET`   | Uma string longa e aleatória (ex.: gerada em https://randomkeygen.com) |
| `PORT`         | `3000` (ou a porta que o Easy Panel mapear)                           |

6. Salve e faça o **deploy**. O Easy Panel vai:

   - clonar o repo do GitHub
   - buildar a imagem com o Dockerfile (frontend + API)
   - subir o container na porta configurada

7. Exponha o app (domínio ou IP + porta) no Easy Panel para acessar no navegador.

## 4. O que o Dockerfile faz

- **Stage 1:** instala dependências do frontend, roda `npm run build` e gera a pasta `dist`.
- **Stage 2:** instala só as dependências do `server/`, copia o código da API e a pasta `dist` do stage 1. Um único processo Node serve:
  - a API em `/api/*`
  - o frontend estático (React) em todas as outras rotas
  - as fotos em `/uploads`

Tudo roda junto na porta **3000**. Não é preciso subir front e back em containers separados.

## 5. Fotos (uploads)

As fotos enviadas pela aplicação ficam dentro do container em `/app/uploads`. Se reiniciar ou recriar o container, elas se perdem. Para persistir, no Easy Panel configure um **volume** mapeando um diretório da VPS para `/app/uploads` no container.

## 6. Resumo rápido

- Código no **GitHub**.
- **PostgreSQL** criado e migrações + usuário rodados.
- No **Easy Panel**: novo app via GitHub → Dockerfile na raiz → variáveis `DATABASE_URL`, `JWT_SECRET`, `PORT` → deploy.

Depois do deploy, acesse a URL do app, faça login com o usuário criado no passo 2 e use o sistema normalmente.
