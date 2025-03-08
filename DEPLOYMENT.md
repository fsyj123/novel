# 部署指南

## 方案一：传统部署

## 必选步骤

### 1. 基础环境安装

```bash
# 更新系统包
sudo apt update
sudo apt upgrade -y

# 安装 Node.js 和 npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node --version
npm --version

# 安装 PM2
sudo npm install -g pm2

# 安装 Nginx
sudo apt install -y nginx
```

### 2. 项目配置

```bash
# 创建应用目录
sudo mkdir -p /var/www/novel
sudo chown -R $USER:$USER /var/www/novel

# 克隆项目代码（替换为你的仓库地址）
git clone <your-repository-url> /var/www/novel

# 进入项目目录
cd /var/www/novel

# 安装依赖
npm install

# 构建项目
npm run build
```

### 3. 环境变量配置

创建 `.env.production` 文件：

```bash
# 添加必要的环境变量
touch .env.production

# 编辑文件添加以下内容（根据实际情况修改）
NODE_ENV=production
# 添加其他必要的环境变量
```

### 4. 启动应用

```bash
# 使用 PM2 启动应用
cd /var/www/novel
pm2 start ecosystem.config.js

# 设置 PM2 开机自启
pm2 startup
pm2 save
```

## 推荐步骤（可选）

### 1. Nginx 配置

创建 Nginx 配置文件：

```bash
sudo nano /etc/nginx/sites-available/novel
```

添加以下配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/novel /etc/nginx/sites-enabled/

# 测试 Nginx 配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 2. SSL 配置

使用 Let's Encrypt 配置 SSL：

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取并配置 SSL 证书
sudo certbot --nginx -d your-domain.com

# 证书会自动更新
```

### 3. PM2 进程管理

创建 PM2 配置文件：

```bash
# 在项目根目录创建 ecosystem.config.js
touch ecosystem.config.js
```

添加以下内容：

```javascript
module.exports = {
  apps: [{
    name: 'novel-app',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
    },
  }],
};
```

## 8. 维护命令

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs novel-app

# 重启应用
pm2 restart novel-app

# 更新代码后重新部署
cd /var/www/novel
git pull
npm install
npm run build
pm2 restart novel-app
```

## 注意事项

1. 确保服务器防火墙允许 80 端口（HTTP）和 443 端口（HTTPS）的访问
2. 定期备份数据和配置文件
3. 监控服务器资源使用情况
4. 定期更新系统和依赖包

## 故障排查

1. 检查应用日志：`pm2 logs novel-app`
2. 检查 Nginx 日志：`sudo tail -f /var/nginx/error.log`
3. 检查系统日志：`sudo journalctl -u nginx`

如果遇到问题，请确保：
- 所有端口都已正确配置
- 环境变量已正确设置
- 文件权限正确
- 系统资源充足

## 方案二：Docker Compose 部署

### 1. 安装 Docker 和 Docker Compose

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 安装 Docker Compose
sudo apt install docker-compose-plugin

# 验证安装
docker --version
docker compose version
```

### 2. 配置项目

确保项目根目录下有以下文件：
- `Dockerfile`：用于构建应用镜像
- `docker-compose.yml`：定义服务编排
- `.env.production`：环境变量配置

### 3. 启动服务

```bash
# 构建并启动服务
docker compose up -d --build

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f
```

### 4. 数据迁移（如果需要）

```bash
# 进入应用容器
docker compose exec app sh

# 执行数据迁移
npx prisma migrate deploy
```

### 5. 维护命令

```bash
# 停止服务
docker compose down

# 重启服务
docker compose restart

# 更新应用
git pull
docker compose up -d --build

# 查看日志
docker compose logs -f app
docker compose logs -f db
```

### 6. 数据备份

```bash
# 备份数据库
docker compose exec db pg_dump -U novel_user novel_db > backup.sql

# 恢复数据库
cat backup.sql | docker compose exec -T db psql -U novel_user novel_db
```

### 注意事项

1. 确保服务器防火墙允许 Docker 使用的端口
2. 定期备份 `postgres_data` 卷中的数据
3. 在生产环境中修改数据库默认密码
4. 考虑使用 Docker 的日志轮转功能
5. 建议使用 Docker 的健康检查功能 