FROM node:18-alpine

WORKDIR /app

# 安装 Prisma CLI
RUN npm install -g prisma

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

# 移除 CMD，因为我们在 docker-compose.yml 中定义了启动命令 