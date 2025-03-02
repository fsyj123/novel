'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '登录失败');
      }

      console.log('登录成功', data);
      localStorage.setItem('userId', data.user.id.toString());
      router.push(data.redirectUrl || '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex flex-col items-center justify-center min-h-screen p-8'>
      <h1 className='text-3xl font-bold mb-8'>登录</h1>
      {error && (
        <div className='w-full max-w-md mb-4 p-3 bg-red-50 text-red-500 rounded-lg'>
          {error}
        </div>
      )}
      <form className='flex flex-col gap-4 w-full max-w-md' onSubmit={handleSubmit}>
        <div className='flex flex-col gap-2'>
          <label htmlFor='username' className='text-sm font-medium'>用户名</label>
          <input
            id='username'
            name='username'
            type='text'
            placeholder='请输入用户名'
            className='border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
        </div>
        <div className='flex flex-col gap-2'>
          <label htmlFor='password' className='text-sm font-medium'>密码</label>
          <input
            id='password'
            name='password'
            type='password'
            placeholder='请输入密码'
            className='border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
        </div>
        <button
          type='submit'
          disabled={loading}
          className='rounded-full bg-blue-500 text-white px-4 py-3 hover:bg-blue-600 transition-colors mt-4 disabled:bg-blue-300'
        >
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
      <p className='mt-6'>
        还没有账户？{' '}
        <Link href="/auth/register" className='text-blue-500 hover:text-blue-600'>
          立即注册
        </Link>
      </p>
      <Link href="/" className='mt-4 text-gray-500 hover:text-gray-600'>
        返回首页
      </Link>
    </div>
  );
} 