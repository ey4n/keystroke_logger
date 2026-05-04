import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxies browser prediction calls to the local model API so we avoid CORS
 * ("Failed to fetch" when the app is on localhost:3000 and the API is on :8000).
 */
export async function POST(req: NextRequest) {
  const upstream =
    process.env.STRESS_MODEL_API_URL ||
    process.env.NEXT_PUBLIC_STRESS_MODEL_API_URL ||
    'http://127.0.0.1:8000';
  const base = upstream.replace(/\/$/, '');
  const body = await req.text();

  let res: Response;
  try {
    res = await fetch(`${base}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `Cannot reach model API at ${base}. Is uvicorn running? ${message}` },
      { status: 502 }
    );
  }

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
  });
}
