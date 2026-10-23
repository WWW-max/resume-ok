#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# ResumeOK - Ubuntu 22.04 / 24.04 生产环境一键部署脚本
# 用法：
#   bash scripts/deploy-ubuntu.sh [域名或公网IP]
# 示例：
#   bash scripts/deploy-ubuntu.sh 123.58.219.165
#   bash scripts/deploy-ubuntu.sh resume-ok.com
# ============================================================================

SITE_HOST="${1:-123.58.219.165}"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

echo "==> [1/6] 检查并配置 2GB Swap 虚拟内存（防止 2G 内存机器编译时 OOM）..."
if ! sudo swapon --show | grep -q "/swapfile"; then
  sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  if ! grep -q "/swapfile" /etc/fstab; then
    echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab >/dev/null
  fi
  echo "    已成功开启 2GB Swap。"
else
  echo "    Swap 已存在，跳过。"
fi

echo "==> [2/6] 检查并安装基础依赖 (Docker / Node.js 22 / pnpm / PM2 / Caddy)..."
sudo mkdir -p /etc/apt/sources.list.d /etc/apt/keyrings
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release git

if ! command -v docker >/dev/null 2>&1; then
  echo "    正在安装 Docker..."
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER" || true
fi

if ! command -v node >/dev/null 2>&1; then
  echo "    正在安装 Node.js 22 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

if ! command -v pnpm >/dev/null 2>&1; then
  sudo npm install -g pnpm@10
fi

if ! command -v pm2 >/dev/null 2>&1; then
  sudo npm install -g pm2
fi

if ! command -v caddy >/dev/null 2>&1; then
  sudo apt-get install -y caddy
fi

echo "==> [3/6] 初始化环境变量与启动 PostgreSQL 数据库容器..."
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  if [[ "$SITE_HOST" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    sed -i "s|^APP_URL=.*|APP_URL=http://${SITE_HOST}|" .env.local
  else
    sed -i "s|^APP_URL=.*|APP_URL=https://${SITE_HOST}|" .env.local
  fi
  # 生产环境默认隐藏本地测试收件箱入口（如需开启真实 SMTP 请编辑 .env.local）
  sed -i "s|^NEXT_PUBLIC_MAILBOX_URL=.*|NEXT_PUBLIC_MAILBOX_URL=|" .env.local
fi

sudo docker compose up -d --wait

echo "==> [4/6] 安装项目依赖并执行数据库迁移..."
pnpm install --frozen-lockfile
pnpm run db:migrate

echo "==> [5/6] 构建 Next.js 生产版本并交由 PM2 守护运行..."
NODE_OPTIONS="--max-old-space-size=1536" pnpm run build

if pm2 describe resume-ok >/dev/null 2>&1; then
  pm2 restart resume-ok --update-env
else
  pm2 start pnpm --name "resume-ok" -- start
fi
pm2 save

echo "==> [6/6] 配置 Caddy 反向代理 (80/443 -> 127.0.0.1:3000)..."
if [[ "$SITE_HOST" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  CADDY_SITE=":80"
  ACCESS_URL="http://${SITE_HOST}"
else
  CADDY_SITE="${SITE_HOST}"
  ACCESS_URL="https://${SITE_HOST}"
fi

sudo tee /etc/caddy/Caddyfile >/dev/null <<EOF
${CADDY_SITE} {
    encode zstd gzip
    reverse_proxy 127.0.0.1:3000
}
EOF

sudo systemctl enable caddy
sudo systemctl reload caddy || sudo systemctl restart caddy

echo ""
echo "============================================================"
echo "✅ 部署完成！现在可以直接在浏览器打开："
echo "   ${ACCESS_URL}"
echo "============================================================"
