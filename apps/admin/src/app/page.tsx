'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRoot() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) router.push('/login');
    else router.push('/dashboard');
  }, []);
  return null;
}
