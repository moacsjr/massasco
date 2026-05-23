# Estágio 1: Builder
FROM node:22-alpine AS builder

# Padronizando o WORKDIR em /app para evitar quebra de caminhos relativos do standalone
WORKDIR /app

# Instala pnpm globalmente
RUN npm install -g pnpm@10

# Copia arquivos de lock e workspace para otimizar cache
COPY pnpm-lock.yaml package.json ./

# Instala dependências (Gera também as engines nativas do Prisma para o Linux Alpine)
RUN pnpm install --frozen-lockfile

# Copia código fonte
COPY . .

# Gera as tipagens do Prisma Client dentro do container
RUN npx prisma generate --schema=prisma/schema.prisma

# Build da aplicação
RUN npx nx build app

# Estágio 2: Runner
FROM node:22-alpine AS runner

# Mantém o mesmo WORKDIR do builder para consistência de caminhos internos do Next.js
WORKDIR /app

ENV NODE_ENV=production

# Cria usuário não-root por segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia o package.json base para que comandos npx funcionem no runtime
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Copia a CLI do Prisma e dependências necessárias para as migrações rodarem em produção
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/engines ./node_modules/@prisma/engines

# Copia artefatos standalone do Next.js
COPY --from=builder --chown=nextjs:nodejs /app/apps/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/app/.next/static ./apps/app/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/app/public ./apps/app/public

# Copia a pasta do Prisma (contendo schema e migrations) para a raiz do runner
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# O Next.js Standalone expõe o servidor na raiz do build gerado
CMD ["node", "apps/app/server.js"]
