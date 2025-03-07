import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';

const prisma = new PrismaClient();

const dialogSchema = z.object({
  dialog: z.array(z.object({
    role: z.string().describe('角色名'),
    content: z.string().describe('说的话或旁白'),
  })),
});

// 创建任务状态表
interface TaskStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: any;
  error?: string;
  updatedAt: Date;
}

const taskStore = new Map<string, TaskStatus>();

// 清理过期任务
setInterval(() => {
  const now = new Date();
  for (const [taskId, task] of taskStore.entries()) {
    // 清理超过30分钟的任务
    if (now.getTime() - task.updatedAt.getTime() > 30 * 60 * 1000) {
      taskStore.delete(taskId);
    }
  }
}, 5 * 60 * 1000);

// 处理文本的异步函数
async function processText(taskId: string, text: string, userId: string) {
  try {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 3000,
      chunkOverlap: 200,
    });

    const settings = await prisma.userConfig.findUnique({
      where: { userId: userId },
    });

    if (!settings) {
      updateTaskStatus(taskId, 'error', { error: 'No settings found' });
      return;
    }

    const llm = new ChatOpenAI({
      model: "gpt-4",
      temperature: 0.7,
      maxRetries: 3,
      apiKey: settings?.llmApi || '',
      configuration: {
        baseURL: settings?.llmBaseUrl || '',
      },
    }).withStructuredOutput(dialogSchema, {
      name: 'dialog',
      strict: true,
    });

    const textChunks = await splitter.splitText(text);
    let roles: string[] = [];
    let split_content: object[] = [];
    
    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      const result = await llm.invoke([
        {
          role: 'system',
          content: `
你需要作为一个文案分析助手，分析文案提取出对话和旁白，然后提取出对应的角色并且命名，
然后需要提取出对应角色说的话或内心想法。你需要提取出 role(角色名，必须), content(说的话或旁白，必须)
将结果以数组的形式，按照先后顺序排列。
在提取 role 时，需要参考 <Roles> 列表，如果提取出的角色在 <Roles> 列表中，则直接使用，否则需要根据上下文提取出角色名。
<Roles> 列表：${roles.join(',')}
          `,
        },
        {
          role: 'user',
          content: chunk,
        },
      ]);

      split_content.push(...result.dialog);
      roles.push(...result.dialog.map((item: any) => item.role));
      roles = [...new Set(roles)];

      // 更新进度
      updateTaskStatus(taskId, 'processing', {
        progress: Math.round(((i + 1) / textChunks.length) * 100),
        result: {
          split_content,
          roles: [...new Set(roles)],
        }
      });
    }

    // 完成处理
    updateTaskStatus(taskId, 'completed', {
      progress: 100,
      result: {
        split_content,
        roles: [...new Set(roles)],
      }
    });

  } catch (error) {
    console.error('Error processing text:', error);
    updateTaskStatus(taskId, 'error', {
      error: 'Failed to process text',
      progress: 0
    });
  }
}

function updateTaskStatus(taskId: string, status: TaskStatus['status'], data: Partial<TaskStatus>) {
  const task = taskStore.get(taskId) || {
    id: taskId,
    status: 'pending',
    progress: 0,
    updatedAt: new Date()
  };

  taskStore.set(taskId, {
    ...task,
    ...data,
    status,
    updatedAt: new Date()
  });
}

// 启动处理的 API 端点
export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    const userId = request.headers.get('userId');

    if (!text || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const taskId = `${userId}_${Date.now()}`;
    
    // 创建任务
    updateTaskStatus(taskId, 'pending', { progress: 0 });
    
    // 启动异步处理
    processText(taskId, text, userId).catch(console.error);

    // 立即返回任务ID
    return NextResponse.json({
      taskId,
      status: 'pending',
    });

  } catch (error) {
    console.error('Error initiating text processing:', error);
    return NextResponse.json(
      { error: 'Failed to initiate processing' },
      { status: 500 }
    );
  }
}

// 获取任务状态的 API 端点
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');

  if (!taskId) {
    return NextResponse.json(
      { error: 'No taskId provided' },
      { status: 400 }
    );
  }

  const task = taskStore.get(taskId);
  if (!task) {
    return NextResponse.json(
      { error: 'Task not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(task);
} 