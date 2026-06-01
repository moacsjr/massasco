# Estágio 1: Builder
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
ENV CI=true
ENV FORCE_COLOR=0
WORKDIR /app
# Instala o pnpm globalmente
RUN npm install -g pnpm@10

# Copia APENAS os arquivos que comprovadamente existem na sua raiz
COPY pnpm-lock.yaml package.json .npmrc* ./

# Instala todas as dependências para o build do Nx
RUN corepack enable pnpm && pnpm install --frozen-lockfile  --dangerously-allow-all-builds

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

# Copia o restante do código fonte
COPY . .

# Gera o Prisma Client (necessário para compilar o TypeScript do Next.js)
RUN npx prisma generate --schema=prisma/schema.prisma

# Executa o build do Nx
RUN corepack enable pnpm && pnpm exec nx build app --verbose=false


# Estágio 2: Runner
FROM node:22-alpine AS runner
WORKDIR /app

# 1. INSTALA AS DEPENDÊNCIAS DO PRISMA EXCLUSIVAS PARA ALPINE
RUN apk add --no-cache libc6-compat openssl openssl-dev

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Cria usuário não-root por segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 1. Copia a pasta public primeiro
COPY --from=builder /app/apps/app/public ./public

# 2. Copia o standalone do Next.js (Ele já traz a estrutura base de node_modules)
COPY --from=builder /app/apps/app/.next/standalone ./

# 3. Copia os arquivos estáticos para o local correto do standalone
COPY --from=builder /app/apps/app/.next/static ./apps/app/.next/static

# 4. Copia os binários e CLI do Prisma para DENTRO do node_modules do standalone
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm

# 5. Garante que a pasta com o schema (Prisma) esteja na raiz para as migrações locais
COPY --from=builder /app/prisma ./prisma

# 6. Altera as permissões de tudo de uma vez antes de virar usuário nextjs
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# O ponto de entrada gerado pelo standalone do Nx fica nesta pasta interna
CMD ["node", "apps/app/server.js"]
