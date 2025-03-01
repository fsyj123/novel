'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent } from 'react';

export default function Register() {
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Implement registration logic here
    console.log('Register attempt');
  };

  return (
    <div className='flex flex-col items-center justify-center min-h-screen p-8'>
      <h1 className='text-3xl font-bold mb-8'>注册</h1>
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
          <label htmlFor='email' className='text-sm font-medium'>邮箱</label>
          <input
            id='email'
            type='email'
            placeholder='请输入邮箱'
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
        <div className='flex flex-col gap-2'>
          <label htmlFor='confirmPassword' className='text-sm font-medium'>确认密码</label>
          <input
            id='confirmPassword'
            type='password'
            placeholder='请再次输入密码'
            className='border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
        </div>
        <button
          type='submit'
          className='rounded-full bg-blue-500 text-white px-4 py-3 hover:bg-blue-600 transition-colors mt-4'
        >
          注册
        </button>
      </form>
      <p className='mt-6'>
        已有账户？{' '}
        <Link href="/auth/login" className='text-blue-500 hover:text-blue-600'>
          立即登录
        </Link>
      </p>
      <Link href="/" className='mt-4 text-gray-500 hover:text-gray-600'>
        返回首页
      </Link>
    </div>
  );
} 