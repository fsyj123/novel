'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent } from 'react';

export default function Login() {
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Implement login logic here
    // For now, just console log
    console.log('Login attempt');
  };

  return (
    <div className='flex flex-col items-center justify-center min-h-screen p-8'>
      <h1 className='text-3xl font-bold mb-8'>登录</h1>
      <form className='flex flex-col gap-4 w-full max-w-md' onSubmit={handleSubmit}>
        <div className='flex flex-col gap-2'>
          <label htmlFor='username' className='text-sm font-medium'>用户名</label>
          <input
            id='username'
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
            type='password'
            placeholder='请输入密码'
            className='border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
        </div>
        <button
          type='submit'
          className='rounded-full bg-blue-500 text-white px-4 py-3 hover:bg-blue-600 transition-colors mt-4'
        >
          登录
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