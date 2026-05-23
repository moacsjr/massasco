# Estágio 1: Builder
FROM node:22-alpine AS builder
WORKDIR /app

# Instala o pnpm globalmente
RUN npm install -g pnpm@10

# Copia os arquivos de configuração do workspace
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml .npmrc ./
COPY apps/app/package.json ./apps/app/

# Instala TODAS as dependências no builder para conseguir rodar o Nx
RUN pnpm install --frozen-lockfile

# Copia o restante do código fonte
COPY . .

# Gera o Prisma Client interno
RUN npx prisma generate --schema=prisma/schema.prisma

# Build da aplicação Next.js via Nx
RUN npx nx build app

# ==============================================================================
# PASSO CHAVE: O pnpm isola o app e extrai uma node_modules 100% física e sem links
# ==============================================================================
RUN pnpm --filter app deploy --prod /app/isolated-production


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

# 1. Copia a node_modules de produção PERFEITA e ISOLADA gerada pelo pnpm deploy
COPY --from=builder --chown=nextjs:nodejs /app/isolated-production/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/isolated-production/package.json ./package.json

# 2. Copia os artefatos standalone compilados do Next.js
COPY --from=builder --chown=nextjs:nodejs /app/apps/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/app/.next/static ./apps/app/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/app/public ./apps/app/public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# 3. Copia a pasta física do pacote da CLI do Prisma do builder para garantir as migrações
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

CMD ["node", "apps/app/server.js"]
