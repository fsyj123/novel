'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { saveAs } from 'file-saver';

interface Voice {
  voice_id: string;
  voice_name: string;
  description: string[];
}

interface RoleVoiceMapping {
  role: string;
  selectedVoice: string;
}

interface DialogItem {
  role: string;
  content: string;
}

export default function FunctionPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<string[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [roleVoiceMappings, setRoleVoiceMappings] = useState<RoleVoiceMapping[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [splitContent, setSplitContent] = useState<DialogItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // 检查用户是否已登录的简单实现
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // TODO: 添加实际的身份验证检查
        // 如果未登录，重定向到登录页
        // router.push('/auth/login');
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };

    checkAuth();
  }, [router]);

  const handleVoiceSelect = (role: string, voiceId: string) => {
    setRoleVoiceMappings(prev => {
      const newMappings = [...prev];
      const index = newMappings.findIndex(m => m.role === role);
      if (index !== -1) {
        newMappings[index].selectedVoice = voiceId;
      } else {
        newMappings.push({ role, selectedVoice: voiceId });
      }
      return newMappings;
    });
  };

  const processNovelText = async () => {
    const novelText = document.querySelector('textarea')?.value;
    if (!novelText) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/split-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'userId': localStorage.getItem('userId') || '',
        },
        body: JSON.stringify({ text: novelText }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to split text');
      }
      
      const { split_content, roles: newRoles, voices: voiceList } = await response.json();
      
      // 保存 split_content 到状态
      setSplitContent(split_content);
      
      // 更新对话文本
      if (document.querySelector('#dialog-textarea')) {
        (document.querySelector('#dialog-textarea') as HTMLTextAreaElement).value = 
          split_content.map((item: any) => `【${item.role}】: ${item.content}`).join('\n');
      }

      // 更新角色列表和音色列表
      setRoles(newRoles);
      setVoices(voiceList);
      
      // 初始化角色-音色映射
      setRoleVoiceMappings(newRoles.map((role: string) => ({
        role,
        selectedVoice: ''
      })));
      
    } catch (error) {
      console.error('Error splitting text:', error);
      alert('Failed to process text');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateVoice = async () => {
    if (!splitContent.length) {
      alert('请先处理文本内容');
      return;
    }

    if (roleVoiceMappings.some(m => !m.selectedVoice)) {
      alert('请为所有角色选择音色');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'userId': localStorage.getItem('userId') || '',
        },
        body: JSON.stringify({
          dialogues: splitContent,
          voiceMappings: roleVoiceMappings,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate voice');
      }

      const blob = await response.blob();
      saveAs(blob, 'generated_voices.zip');
    } catch (error) {
      console.error('Error generating voice:', error);
      alert('生成配音失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // Add new handler for dialog textarea changes
  const handleDialogChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    // Parse the text back into splitContent format
    const newSplitContent = newText.split('\n')
      .map(line => {
        const match = line.match(/【(.+?)】:\s*(.+)/);
        if (match) {
          return {
            role: match[1],
            content: match[2]
          };
        }
        return null;
      })
      .filter((item): item is DialogItem => item !== null);
    
    setSplitContent(newSplitContent);

    // Extract unique roles from the new content
    const newRoles = Array.from(new Set(newSplitContent.map(item => item.role)));
    
    // Update roles if there are changes
    if (JSON.stringify(newRoles.sort()) !== JSON.stringify(roles.sort())) {
      setRoles(newRoles);
      // Update role-voice mappings while preserving existing mappings
      setRoleVoiceMappings(prevMappings => {
        const newMappings = newRoles.map(role => ({
          role,
          selectedVoice: prevMappings.find(m => m.role === role)?.selectedVoice || ''
        }));
        return newMappings;
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      {/* 顶部导航栏 */}
      <div className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold dark:text-white">小说配音助手</h1>
            </div>
            <div className="ml-4 flex items-center">
              <button
                onClick={() => router.push('/settings?userId=' + localStorage.getItem('userId'))}
                className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧区域：小说原文输入 */}
        <div className="w-1/3 p-4 bg-white dark:bg-gray-800 m-2 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4 dark:text-white">原文输入</h2>
          <textarea
            className="w-full h-[calc(100%-6rem)] p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            placeholder="请输入小说原文..."
          />
        </div>

        {/* 中间区域：多角色对话文案 */}
        <div className="w-1/3 p-4 bg-white dark:bg-gray-800 m-2 rounded-lg shadow-lg relative">
          <div className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <button 
              onClick={processNovelText}
              disabled={isProcessing}
              className={`bg-blue-500 text-white p-2 rounded-full 
                hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-800
                transition-colors relative ${isProcessing ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              )}
            </button>
          </div>
          <h2 className="text-xl font-bold mb-4 dark:text-white">对话文案</h2>
          <textarea
            id="dialog-textarea"
            className="w-full h-[calc(100%-6rem)] p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            placeholder="在这里编辑多角色对话文案...&#10;格式：【角色】: 对话内容"
            onChange={handleDialogChange}
          />
        </div>

        {/* 右侧区域：音色选择 */}
        <div className="w-1/3 p-4 bg-white dark:bg-gray-800 m-2 rounded-lg shadow-lg relative">
          <h2 className="text-xl font-bold mb-4 dark:text-white">音色选择</h2>
          <div className="space-y-4">
            {roles.map((role, index) => (
              <div key={role} className="p-4 border rounded-lg dark:border-gray-600">
                <h3 className="font-medium mb-2 dark:text-white">{role}</h3>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="请输入音色ID"
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    value={roleVoiceMappings.find(m => m.role === role)?.selectedVoice || ''}
                    onChange={(e) => handleVoiceSelect(role, e.target.value)}
                  />
                </div>
              </div>
            ))}
            
            {/* 生成配音按钮 */}
            {roles.length > 0 && (
              <button
                onClick={handleGenerateVoice}
                disabled={isGenerating}
                className="w-full mt-4 py-3 px-4 bg-blue-500 text-white rounded-lg 
                  hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-800 
                  transition-colors relative flex items-center justify-center"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    生成配音中...
                  </>
                ) : (
                  '生成配音'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}