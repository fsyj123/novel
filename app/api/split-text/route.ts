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

interface Voice {
  voice_id: string;
  voice_name: string;
  description: string[]
}


// const getVoiceList = async (minimax_token: string) => {
//   if (VOICE_LIST.length > 0) {
//     return VOICE_LIST;
//   }
//   const response = await fetch('https://api.minimax.chat/v1/get_voice', {
//     method: 'GET',
//     headers: {
//       'authority': 'api.minimax.chat',
//       'Authorization': `Bearer ${minimax_token}`
//     },
//     body: JSON.stringify({
//       voice_type: 'all',
//     })
//   });
//   // response example
//   // {
//   //   "system_voice": [
//   //       {
//   //           "voice_id": "",
//   //           "voice_name": "",
//   //           "description": []
//   //       },
//   //       {
//   //           "voice_id": "",
//   //           "voice_name": "",
//   //           "description": []
//   //       }
//   //   ],
//   //   "voice_cloning": [
//   //       {
//   //           "voice_id": "",
//   //           "description":[], 
//   //           "created_time": ""
//   //       },
//   //       {
//   //           "voice_id": "",
//   //           "description":[],
//   //           "created_time": ""
//   //       }
//   //   ],
//   //       "voice_generation": [
//   //       {
//   //           "voice_id": "",
//   //           "description":[],
//   //           "created_time": ""
//   //       },
//   //       {
//   //           "voice_id": "",
//   //           "description":[],
//   //           "created_time": ""
//   //       }
//   //   ]，
//   // 将 system_voice{voice_id, voice_name} 和 voice_cloning{voice_id, description}，voice_generation{voice_id} 合并
//   const data = await response.json();
//   // 存入 VOICE_LIST
//   VOICE_LIST.push(...data.data);
//   return VOICE_LIST;
// }

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    const userId = request.headers.get('userId');
    
    console.log('Received request:', {
      text: text ? text.substring(0, 100) + '...' : null,
      userId,
      headers: Object.fromEntries(request.headers.entries())
    });

    if (!text) {
      console.log('No text provided');
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      console.log('No userId provided');
      return NextResponse.json(
        { error: 'No userId provided' },
        { status: 400 }
      );
    }
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 3000,
      chunkOverlap: 200,
    });
    // 获取用户的 settings
    const settings = await prisma.userConfig.findUnique({
      where: {
        userId: userId,
      },
    });
    if (!settings) {
      return NextResponse.json(
        { error: 'No settings found' },
        { status: 400 }
      );
    }

    const llm = new ChatOpenAI({
      model: "gpt-4o",
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

    let split_content:object[] = [];

    for (const chunk of textChunks) {
      const result = await llm.invoke([
        {
          role: 'system',
          content: `
你需要作为一个文案分析助手，分析文案提取出对话和旁白，然后提取出对应的角色并且命名，
然后需要提取出对应角色说的话或内心想法。你需要提取出 role(角色名，必须), content(说的话或旁白，必须)
将结果以数组的形式，按照先后顺序排列。
在提取 role 时，需要参考 <Roles> 列表，如果提取出的角色在 <Roles> 列表中，则直接使用，否则需要根据上下文提取出角色名。
<Roles> 列表：${roles.join(',')}
结果示例：
[
  {
      role: "roleA",
      content: "xxx"
  },
  {
      role: "旁白",
      content: "xxx"
  }
]
          `,
        },
        {
          role: 'user',
          content: chunk,
        },
      ]);
      split_content.push(...result.dialog);
      roles.push(...result.dialog.map((item: any) => item.role));
      // 去重
      roles = [...new Set(roles)];
    }

    return NextResponse.json({
      split_content,
      roles: [...new Set(roles)],  // 返回去重后的角色列表
    });
    
  } catch (error) {
    console.error('Error processing text:', error);
    return NextResponse.json(
      { error: 'Failed to process text' },
      { status: 500 }
    );
  }
} 