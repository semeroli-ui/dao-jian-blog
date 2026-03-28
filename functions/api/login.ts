import * as jose from 'jose';
import bcrypt from 'bcryptjs';

export const onRequestPost: PagesFunction<{ DB: D1Database; JWT_SECRET?: string }> = async ({ request, env }) => {
  const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET || 'dao-secret-key');
  try {
    const { username, password } = await request.json() as any;
    
    const user: any = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
    
    if (user && bcrypt.compareSync(password, user.password)) {
      const token = await new jose.SignJWT({ id: user.id, username: user.username })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(JWT_SECRET);
        
      return new Response(JSON.stringify({ token }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
