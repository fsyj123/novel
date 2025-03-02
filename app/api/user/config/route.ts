import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient();

// 获取用户配置
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // 从查询参数获取用户 ID

    if (!userId) {
      return NextResponse.json({ error: '用户 ID 是必需的' }, { status: 400 });
    }

    const config = await prisma.userConfig.findUnique({
      where: { userId : userId },
    });

    return NextResponse.json({ config: config || {} });
  } catch (error) {
    console.error('Error fetching user config:', error);
    return NextResponse.json(
      { error: '获取配置失败' },
      { status: 500 }
    );
  }
}

// 保存用户配置
export async function POST(request: Request) {
  try {
    const { llmApi, llmBaseUrl, hailuoGroup, hailuoToken } = await request.json();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // 从查询参数获取用户 ID

    if (!userId) {
      return NextResponse.json({ error: '用户 ID 是必需的' }, { status: 400 });
    }

    const config = await prisma.userConfig.upsert({
      where: { userId: userId },
      update: {
        llmApi,
        llmBaseUrl,
        hailuoGroup,
        hailuoToken,
      },
      create: {
        userId: userId,
        llmApi,
        llmBaseUrl,
        hailuoGroup,
        hailuoToken,
      },
    });

    return NextResponse.json({ message: '配置已保存', config });
  } catch (error) {
    console.error('Error saving user config:', error);
    return NextResponse.json(
      { error: '保存配置失败' },
      { status: 500 }
    );
  }
} 