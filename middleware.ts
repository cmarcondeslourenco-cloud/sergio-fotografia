import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const loginUrl = (reason?: 'configuracao' | 'conexao') => {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);
    if (reason) login.searchParams.set('erro', reason);
    return login;
  };

  if (!url || !key) {
    return NextResponse.redirect(loginUrl('configuracao'));
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values) => {
        values.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  let user = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    // A falha da rede/autenticação não pode deixar a rota administrativa sem resposta.
    return NextResponse.redirect(loginUrl('conexao'));
  }
  if (!user) {
    return NextResponse.redirect(loginUrl());
  }

  return response;
}

export const config = { matcher: ['/admin/:path*'] };
