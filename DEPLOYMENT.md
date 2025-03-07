# 部署指南

本文档介绍如何将小说配音助手部署到 Ubuntu 服务器上。

## 系统要求

- Ubuntu 20.04 LTS 或更高版本
- Node.js 18.x 或更高版本
- npm 9.x 或更高版本
- PM2 (用于进程管理)
- Nginx (用于反向代理)

## 1. 安装基础环境

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

## 2. 配置项目

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

## 3. 配置环境变量

创建 `.env.production` 文件：

```bash
# 添加必要的环境变量
touch .env.production

# 编辑文件添加以下内容（根据实际情况修改）
NODE_ENV=production
# 添加其他必要的环境变量
```

## 4. 配置 PM2

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

## 5. 配置 Nginx

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

## 6. 启动应用

```bash
# 使用 PM2 启动应用
cd /var/www/novel
pm2 start ecosystem.config.js

# 设置 PM2 开机自启
pm2 startup
pm2 save
```

## 7. SSL 配置（可选但推荐）

使用 Let's Encrypt 配置 SSL：

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取并配置 SSL 证书
sudo certbot --nginx -d your-domain.com

# 证书会自动更新
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