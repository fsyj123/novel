import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function generateAudio(text: string, voiceId: string, miniMaxToken: string, groupId: string, outputPath: string): Promise<boolean> {
  try {
    const url = `https://api.minimax.chat/v1/t2a_v2?GroupId=${groupId}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${miniMaxToken}`
      },
      body: JSON.stringify({
        model: "speech-01-turbo",
        text: text,
        stream: false,
        voice_setting: {
          voice_id: voiceId,
          speed: 1.0,
          vol: 1.0,
          pitch: 0
        },
        audio_setting: {
          sample_rate: 32000,
          bitrate: 128000,
          format: "mp3",
          channel: 1
        },
        language_boost: "auto"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to generate audio:', errorText);
      return false;
    }

    const data = await response.json();
    if (data.base_resp?.status_code === 0 && data.data?.audio) {
      const audioBytes = Buffer.from(data.data.audio, 'hex');
      await fs.writeFile(outputPath, audioBytes);
      
      if (data.extra_info) {
        console.log('Audio info:', {
          length: data.extra_info.audio_length,
          sampleRate: data.extra_info.audio_sample_rate,
          size: data.extra_info.audio_size,
          bitrate: data.extra_info.audio_bitrate,
          format: data.extra_info.audio_format
        });
      }
      return true;
    }

    console.error('Invalid response format:', data);
    return false;
  } catch (error) {
    console.error('Error generating audio:', error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const { dialogues, voiceMappings } = await request.json();
    const userId = request.headers.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'No userId provided' }, { status: 400 });
    }

    // 获取用户配置
    const settings = await prisma.userConfig.findUnique({
      where: { userId: userId },
    });

    if (!settings?.hailuoToken) {
      return NextResponse.json({ error: 'No MiniMax token found' }, { status: 400 });
    }

    // 创建临时目录
    const tempDir = path.join(process.cwd(), 'temp', uuidv4());
    await fs.mkdir(tempDir, { recursive: true });

    // 生成每段对话的音频
    const audioFiles: string[] = [];
    for (let i = 0; i < dialogues.length; i++) {
      const dialogue = dialogues[i];
      const mapping = voiceMappings.find((m: any) => m.role === dialogue.role);
      if (!mapping) continue;

      const outputPath = path.join(tempDir, `${i + 1}_${dialogue.role}.mp3`);
      const success = await generateAudio(
        dialogue.content,
        mapping.selectedVoice,
        settings.hailuoToken,
        settings?.hailuoGroup || '',
        outputPath
      );

      if (success) {
        audioFiles.push(outputPath);
      } else {
        console.error(`Failed to generate audio for dialogue ${i + 1}`);
      }
    }

    if (audioFiles.length === 0) {
      await fs.rm(tempDir, { recursive: true, force: true });
      return NextResponse.json(
        { error: 'No audio files were generated' },
        { status: 500 }
      );
    }

    // 创建 ZIP 文件
    const zipPath = path.join(tempDir, 'voices.zip');
    
    // 使用 JSZip 替代 archiver
    const JSZip = require('jszip');
    const zip = new JSZip();

    // 添加所有音频文件到 zip
    for (const audioFile of audioFiles) {
      const fileName = path.basename(audioFile);
      const fileContent = await fs.readFile(audioFile);
      zip.file(fileName, fileContent);
    }

    // 生成 zip 文件
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 9
      }
    });

    // 清理临时文件
    await fs.rm(tempDir, { recursive: true, force: true });

    // 返回 ZIP 文件
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename=generated_voices.zip',
      },
    });

  } catch (error) {
    console.error('Error generating voice:', error);
    return NextResponse.json(
      { error: 'Failed to generate voice' },
      { status: 500 }
    );
  }
} 