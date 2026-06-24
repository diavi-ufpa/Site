import { adminAuth } from '@/lib/firebase-admin';
import { identitySql } from '@/lib/identity-db';

function getBearerToken(request) {
  const authorization = request.headers.get('authorization');

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }

  return authorization.replace('Bearer ', '');
}

export async function requireIdentityUser(request) {
  const token = getBearerToken(request);

  if (!token) {
    return {
      ok: false,
      status: 401,
      error: 'Token não informado',
    };
  }

  let decodedToken;

  try {
    decodedToken = await adminAuth.verifyIdToken(token);
  } catch {
    return {
      ok: false,
      status: 401,
      error: 'Token inválido',
    };
  }

  const firebaseUid = decodedToken.uid;

  const users = await identitySql`
    SELECT
      id,
      firebase_uid,
      email,
      name,
      role,
      status,
      created_at,
      last_login_at
    FROM identity_users
    WHERE firebase_uid = ${firebaseUid}
    LIMIT 1
  `;

  const identityUser = users[0];

  if (!identityUser) {
    return {
      ok: false,
      status: 403,
      error: 'Usuário autenticado, mas não autorizado na DIAVI',
    };
  }

  if (identityUser.status !== 'active') {
    return {
      ok: false,
      status: 403,
      error: 'Usuário inativo ou pendente',
      userStatus: identityUser.status,
    };
  }

  return {
    ok: true,
    user: identityUser,
  };
}
