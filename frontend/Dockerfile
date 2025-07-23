# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# 必要なパッケージをインストール
RUN apk add --no-cache openssl

# pnpmのインストール
RUN npm install -g pnpm

# 依存関係のファイルだけを先にコピー
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# 依存関係のインストール（キャッシュを活用）
RUN PNPM_HOME="/root/.local/share/pnpm" \
    PATH="$PNPM_HOME:$PATH" \
    pnpm install --frozen-lockfile --prefer-offline

# Prisma Clientの生成
RUN npx prisma generate

# ソースコードをコピー
COPY . .

# ビルド
RUN pnpm run build || (cat .next/error.log && exit 1)

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# 必要なパッケージをインストール
RUN apk add --no-cache openssl

# pnpmのインストール
RUN npm install -g pnpm

# アプリケーションファイルのコピー
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/prisma ./prisma

# 本番環境の依存関係のインストール
RUN PNPM_HOME="/root/.local/share/pnpm" \
    PATH="$PNPM_HOME:$PATH" \
    pnpm install --prod --frozen-lockfile --prefer-offline

# Prisma Clientの生成
RUN npx prisma generate

# ビルド済みファイルのコピー
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["pnpm", "run", "start"] 