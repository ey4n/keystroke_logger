'use client';

import React, { useEffect, useState } from 'react';
import App from '../App';
import { createBrowserClient } from '@supabase/ssr';

export default function Page() {
  const [todos, setTodos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function fetchTodos() {
      const { data } = await supabase.from('todos').select();
      setTodos(data || []);
      setLoading(false);
    }

    fetchTodos();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <ul>
        {todos?.map((todo) => (
          <li key={todo.id}>{todo.name || JSON.stringify(todo)}</li>
        ))}
      </ul>
      <App />
    </div>
  );
}