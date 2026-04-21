#!/bin/bash
set -e

echo "==> Installing backend dependencies..."
npm --prefix backend install

echo "==> Linking shared dependencies to backend's node_modules..."
mkdir -p shared/node_modules
rm -rf shared/node_modules/drizzle-orm shared/node_modules/drizzle-zod shared/node_modules/zod
ln -s "$(pwd)/backend/node_modules/drizzle-orm" shared/node_modules/drizzle-orm
ln -s "$(pwd)/backend/node_modules/drizzle-zod" shared/node_modules/drizzle-zod
ln -s "$(pwd)/backend/node_modules/zod" shared/node_modules/zod

echo "==> Installing frontend dependencies..."
npm --prefix frontend install

echo "==> Building frontend..."
npm --prefix frontend run build

echo "==> Building backend..."
npm --prefix backend run build

echo "==> Build complete."
