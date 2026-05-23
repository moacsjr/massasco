# Estágio 1: Builder
FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@10
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile # Instala todas as dependências
COPY . .
RUN npx prisma generate --schema=prisma/schema.prisma
RUN npx nx build app

# Estágio 2: Runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copia os artefatos standalone e o prisma gerado
COPY --from=builder --chown=nextjs:nodejs /app/apps/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/app/.next/static ./apps/app/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
# GARANTIA: Copia o prisma/prisma CLI e engines do builder
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs
CMD ["node", "apps/app/server.js"]
