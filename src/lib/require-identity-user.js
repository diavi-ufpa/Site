import { adminAuth } from '@/lib/firebase-admin';
import { identitySql } from '@/lib/identity-db';

const RETRYABLE_NEON_ERROR = 'Control plane request failed';

function getBearerToken(request) {
  const authorization = request.headers.get('authorization');

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }

  return authorization.replace('Bearer ', '');
}

function isRetryableIdentityDbError(error) {
  return (
    error?.['neon:retryable'] === true ||
    error?.message?.includes(RETRYABLE_NEON_ERROR)
  );
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function getIdentityUsers(firebaseUid) {
  const retryDelays = [400, 1200, 2500];
  let lastError;

  for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
    try {
      return await identitySql`
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
    } catch (error) {
      lastError = error;

      if (!isRetryableIdentityDbError(error) || attempt === retryDelays.length) {
        throw error;
      }

      await wait(retryDelays[attempt]);
    }
  }

  throw lastError;
}

export async function requireIdentityUser(request) {
  const token = getBearerToken(request);

  if (!token) {
    return {
      ok: false,
      status: 401,
      error: 'Token nao informado',
    };
  }

  let decodedToken;

  try {
    decodedToken = await adminAuth.verifyIdToken(token);
  } catch {
    return {
      ok: false,
      status: 401,
      error: 'Token invalido',
    };
  }

  const firebaseUid = decodedToken.uid;
  const users = await getIdentityUsers(firebaseUid);
  const identityUser = users[0];

  if (!identityUser) {
    return {
      ok: false,
      status: 403,
      error: 'Usuario autenticado, mas nao autorizado na DIAVI',
    };
  }

  if (identityUser.status !== 'active') {
    return {
      ok: false,
      status: 403,
      error: 'Usuario inativo ou pendente',
      userStatus: identityUser.status,
    };
  }

  return {
    ok: true,
    user: identityUser,
  };
}
