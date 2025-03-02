'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

interface UserConfig {
  llmApi: string;
  llmBaseUrl: string;
  hailuoGroup: string;
  hailuoToken: string;
}

export default function Settings() {
  const router = useRouter();
  const [config, setConfig] = useState<UserConfig>({
    llmApi: '',
    llmBaseUrl: '',
    hailuoGroup: '',
    hailuoToken: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });

  useEffect(() => {
    const fetchConfig = async () => {
      const userId = localStorage.getItem('userId'); // 从本地存储获取用户 ID
      if (!userId) {
        console.error('用户未登录');
        router.push('/auth/login'); // 如果未登录，重定向到登录页
        return;
      }

      try {
        const response = await fetch(`/api/user/config?userId=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch config');
        }
        const data = await response.json();
        setConfig(data.config);
      } catch (error) {
        console.error('Error fetching config:', error);
      }
    };

    fetchConfig();
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', content: '' });

    const userId = localStorage.getItem('userId'); // 从本地存储获取用户 ID

    try {
      const response = await fetch(`/api/user/config?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'userId': userId || '',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '保存失败');
      }

      setMessage({ type: 'success', content: '配置已保存' });
    } catch (error) {
      setMessage({
        type: 'error',
        content: error instanceof Error ? error.message : '保存失败',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 dark:text-white">用户配置</h2>
        {message.content && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/30 text-green-500 dark:text-green-400' 
                : 'bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400'
            }`}
          >
            {message.content}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="llmApi" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              LLM API Key
            </label>
            <input
              type="text"
              id="llmApi"
              value={config.llmApi}
              onChange={(e) => setConfig({ ...config, llmApi: e.target.value })}
              className="mt-1 block w-full border dark:border-gray-600 rounded-md shadow-sm py-2 px-3 
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
          <div>
            <label htmlFor="llmBaseUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              LLM Base URL
            </label>
            <input
              type="text"
              id="llmBaseUrl"
              value={config.llmBaseUrl}
              onChange={(e) => setConfig({ ...config, llmBaseUrl: e.target.value })}
              className="mt-1 block w-full border dark:border-gray-600 rounded-md shadow-sm py-2 px-3 
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
          <div>
            <label htmlFor="hailuoGroup" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              海螺 Group ID
            </label>
            <input
              type="text"
              id="hailuoGroup"
              value={config.hailuoGroup}
              onChange={(e) => setConfig({ ...config, hailuoGroup: e.target.value })}
              className="mt-1 block w-full border dark:border-gray-600 rounded-md shadow-sm py-2 px-3 
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
          <div>
            <label htmlFor="hailuoToken" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              海螺 Token
            </label>
            <input
              type="password"
              id="hailuoToken"
              value={config.hailuoToken}
              onChange={(e) => setConfig({ ...config, hailuoToken: e.target.value })}
              className="mt-1 block w-full border dark:border-gray-600 rounded-md shadow-sm py-2 px-3 
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              返回
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 
                disabled:bg-blue-300 dark:disabled:bg-blue-800 
                dark:hover:bg-blue-700 transition-colors"
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 