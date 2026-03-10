'use client';

import { createClient } from '../../utils/supabase/client';
import { useEffect, useState } from 'react';

export default function Page() {
  const [todos, setTodos] = useState<{ id: string; title?: string }[] | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.from('todos').select('*').then(({ data }) => setTodos(data ?? null));
  }, []);

  if (todos === null) return <p className="p-4 text-gray-500">Loading…</p>;

  return (
    <ul className="list-disc list-inside p-4">
      {todos.map((todo) => (
        <li key={todo.id}>{todo.title ?? JSON.stringify(todo)}</li>
      ))}
    </ul>
  );
}
