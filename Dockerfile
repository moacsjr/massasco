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

# --no-progress remove as barras de animação
# --verbose=false garante que logs excessivos sejam evitados
RUN corepack enable pnpm && pnpm exec nx build app --verbose=false && ls -R dist


# Estágio 2: Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Cria usuário não-root por segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app && \
    chown -R nextjs:nodejs /app

# 1. Copia a pasta public (ajuste o caminho se ela estiver em apps/app/public)
COPY --from=builder /app/apps/app/public ./public

# 2. Garante a criação do diretório .next e permissões
RUN mkdir .next && chown nextjs:nodejs .next

# 3. Copia o standalone gerado pelo Next.js dentro da pasta dist do Nx
COPY --from=builder --chown=nextjs:nodejs /app/apps/app/.next/standalone ./

# 4. Copia os arquivos estáticos para otimização
COPY --from=builder --chown=nextjs:nodejs /app/apps/app/.next/static ./dist/apps/app/.next/static


USER nextjs

EXPOSE 3000

ENV PORT=3000

# O ponto de entrada gerado pelo standalone do Nx fica nesta pasta interna
CMD ["node", "apps/app/server.js"]
