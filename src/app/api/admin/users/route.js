import { requireAdminUser } from '@/lib/require-admin-user';
import { identitySql } from '@/lib/identity-db';
import { adminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function listAllFirebaseUsers() {
  const users = [];
  let pageToken;

  do {
    const page = await adminAuth.listUsers(1000, pageToken);
    users.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken);

  return users;
}

function normalizeEmail(email) {
  return email?.trim().toLowerCase() || null;
}

function mergeUsers(neonUsers, firebaseUsers) {
  const firebaseByUid = new Map(firebaseUsers.map((user) => [user.uid, user]));
  const firebaseByEmail = new Map(
    firebaseUsers.filter((user) => user.email).map((user) => [normalizeEmail(user.email), user])
  );
  const matchedFirebaseUids = new Set();

  const users = neonUsers.map((neonUser) => {
    const firebaseUser = firebaseByUid.get(neonUser.firebase_uid) ||
      firebaseByEmail.get(normalizeEmail(neonUser.email));

    if (firebaseUser) matchedFirebaseUids.add(firebaseUser.uid);

    return {
      ...neonUser,
      firebase_uid: firebaseUser?.uid || neonUser.firebase_uid,
      email: firebaseUser?.email || neonUser.email,
      name: neonUser.name || firebaseUser?.displayName || null,
      firebase_created_at: firebaseUser?.metadata.creationTime || null,
      firebase_last_login_at: firebaseUser?.metadata.lastSignInTime || null,
      firebase_disabled: firebaseUser?.disabled ?? null,
      sources: { firebase: Boolean(firebaseUser), neon: true },
    };
  });

  for (const firebaseUser of firebaseUsers) {
    if (matchedFirebaseUids.has(firebaseUser.uid)) continue;

    users.push({
      id: `firebase:${firebaseUser.uid}`,
      firebase_uid: firebaseUser.uid,
      email: firebaseUser.email || null,
      name: firebaseUser.displayName || null,
      role: null,
      status: null,
      created_at: null,
      last_login_at: null,
      firebase_created_at: firebaseUser.metadata.creationTime || null,
      firebase_last_login_at: firebaseUser.metadata.lastSignInTime || null,
      firebase_disabled: firebaseUser.disabled,
      sources: { firebase: true, neon: false },
    });
  }

  return users.sort((a, b) => {
    const dateA = a.created_at || a.firebase_created_at || '';
    const dateB = b.created_at || b.firebase_created_at || '';
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
}

export async function GET(request) {
  try {
    const auth = await requireAdminUser(request);

    if (!auth.ok) {
      return Response.json(
        { ok: false, error: auth.error },
        {
          status: auth.status,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    const [neonUsers, firebaseUsers] = await Promise.all([
      identitySql`
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
      ORDER BY created_at DESC
      `,
      listAllFirebaseUsers(),
    ]);

    const users = mergeUsers(neonUsers, firebaseUsers);

    return Response.json(
      { ok: true, users },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Erro em /api/admin/users:', error);

    return Response.json(
      { ok: false, error: 'Erro ao consultar usuários' },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }
}
