# Estágio 1: Builder
FROM node:22-alpine AS builder
WORKDIR /app

# Instala pnpm globalmente
RUN npm install -g pnpm@10

# Copia arquivos de lock e workspace para otimizar cache
COPY pnpm-lock.yaml package.json ./

# Instala todas as dependências (incluindo devDependencies do Nx)
RUN pnpm install --frozen-lockfile

# Copia código fonte
COPY . .

# Gera as tipagens e engines locais do Prisma
RUN npx prisma generate --schema=prisma/schema.prisma

# Build da aplicação Next.js Standalone
RUN npx nx build app


# Estágio 2: Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Instala o pnpm no container final para estruturar a node_modules de produção
RUN npm install -g pnpm@10

# Cria usuário não-root por segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 1. Copia os arquivos de pacotes para o Runner reconstruir as dependências
COPY pnpm-lock.yaml package.json ./

# 2. Instala APENAS as dependências de produção.
# Isso recria TODA a árvore de links do Prisma e AWS SDK nativamente no Alpine, sem erros de links simbólicos.
RUN pnpm install --frozen-lockfile --prod

# 3. Copia os artefatos standalone compilados do Next.js
COPY --from=builder --chown=nextjs:nodejs /app/apps/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/app/.next/static ./apps/app/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/app/public ./apps/app/public

# 4. Copia a pasta do Prisma (contendo seu schema.prisma para as migrações)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

# Executa o servidor a partir da pasta gerada pelo Nx
CMD ["node", "apps/app/server.js"]
