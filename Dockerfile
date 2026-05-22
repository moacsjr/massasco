# Estágio 1: Builder
FROM node:22-alpine AS builder

WORKDIR /home/node

# Instala pnpm globalmente
RUN npm install -g pnpm@10

# Copia arquivos de lock e workspace para otimizar cache
COPY pnpm-lock.yaml package.json ./

# Instala dependências
RUN pnpm install --frozen-lockfile

# Copia código fonte
COPY . .

# Build da aplicação
RUN npx nx build app

# Estágio 2: Runner
FROM node:22-alpine AS runner

ENV NODE_ENV=production

# Cria usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia artefatos standalone do Next.js
COPY --from=builder --chown=nextjs:nodejs /home/node/apps/app/.next/standalone /app
COPY --from=builder --chown=nextjs:nodejs /home/node/apps/app/.next/static /app/.next/static
COPY --from=builder --chown=nextjs:nodejs /home/node/apps/app/public /app/public

# Copia schema do Prisma para migrações
COPY --from=builder --chown=nextjs:nodejs /home/node/prisma /app/prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "/app/server.js"]
