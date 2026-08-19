import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { password?: string };
    const attempt = (body.password || '').trim().toLowerCase();
    const expected = (process.env.CAT_GATE_PASSWORD || 'apperception').trim().toLowerCase();

    if (attempt !== expected) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'GATE_DENIED',
            message: 'That is not the password.',
          },
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          unlocked: true,
          message: 'Unlocked. Please do not circulate these.',
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (err) {
    console.error('[Gate API] Error:', err);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'INTERNAL',
          message: 'Unable to verify password.',
        },
      },
      { status: 500 }
    );
  }
}
