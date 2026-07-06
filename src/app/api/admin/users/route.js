import { requireAdminUser } from '@/lib/require-admin-user';
import { identitySql } from '@/lib/identity-db';
import { adminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = new Set(['admin', 'user']);
const ALLOWED_STATUSES = new Set(['active', 'inactive', 'pending']);

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

export async function PATCH(request) {
  try {
    const auth = await requireAdminUser(request);

    if (!auth.ok) {
      return Response.json(
        { ok: false, error: auth.error },
        { status: auth.status, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const body = await request.json().catch(() => null);
    const id = body?.id;
    const role = body?.role;
    const status = body?.status;

    if (!id || !ALLOWED_ROLES.has(role) || !ALLOWED_STATUSES.has(status)) {
      return Response.json(
        { ok: false, error: 'Dados de acesso inválidos' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const targetRows = await identitySql`
      SELECT id, role, status
      FROM identity_users
      WHERE id = ${id}
      LIMIT 1
    `;
    const target = targetRows[0];

    if (!target) {
      return Response.json(
        { ok: false, error: 'Usuário não encontrado no Neon' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const removesActiveAdmin =
      target.role === 'admin' &&
      target.status === 'active' &&
      (role !== 'admin' || status !== 'active');

    if (String(target.id) === String(auth.user.id) && removesActiveAdmin) {
      return Response.json(
        { ok: false, error: 'Você não pode remover o próprio acesso administrativo' },
        { status: 409, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const updatedRows = await identitySql`
      UPDATE identity_users
      SET role = ${role}, status = ${status}, updated_at = NOW()
      WHERE id = ${id}
        AND (
          ${removesActiveAdmin}::boolean = FALSE
          OR EXISTS (
            SELECT 1
            FROM identity_users AS other_admin
            WHERE other_admin.id <> ${id}
              AND other_admin.role = 'admin'
              AND other_admin.status = 'active'
          )
        )
      RETURNING id, email, name, role, status, created_at, last_login_at
    `;

    if (!updatedRows[0]) {
      return Response.json(
        { ok: false, error: 'O sistema precisa manter ao menos um administrador ativo' },
        { status: 409, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return Response.json(
      { ok: true, user: updatedRows[0] },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Erro ao atualizar usuário em /api/admin/users:', error);

    return Response.json(
      { ok: false, error: 'Erro ao atualizar acesso do usuário' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdminUser(request);

    if (!auth.ok) {
      return Response.json(
        { ok: false, error: auth.error },
        { status: auth.status, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const body = await request.json().catch(() => null);
    const firebaseUid = body?.firebase_uid;

    if (typeof firebaseUid !== 'string' || !firebaseUid.trim() || firebaseUid.length > 128) {
      return Response.json(
        { ok: false, error: 'Identificador do Firebase inválido' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    let firebaseUser;

    try {
      firebaseUser = await adminAuth.getUser(firebaseUid);
    } catch (error) {
      if (error?.code === 'auth/user-not-found') {
        return Response.json(
          { ok: false, error: 'Usuário não encontrado no Firebase' },
          { status: 404, headers: { 'Cache-Control': 'no-store' } }
        );
      }
      throw error;
    }

    if (!firebaseUser.email) {
      return Response.json(
        { ok: false, error: 'A conta Firebase precisa ter um e-mail' },
        { status: 409, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const existingUsers = await identitySql`
      SELECT id
      FROM identity_users
      WHERE firebase_uid = ${firebaseUser.uid}
         OR LOWER(email) = LOWER(${firebaseUser.email})
      LIMIT 1
    `;

    if (existingUsers[0]) {
      return Response.json(
        { ok: false, error: 'Usuário já cadastrado no Neon' },
        { status: 409, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const insertedUsers = await identitySql`
      INSERT INTO identity_users (firebase_uid, email, name, role, status)
      VALUES (
        ${firebaseUser.uid},
        ${firebaseUser.email},
        ${firebaseUser.displayName || null},
        'user',
        'pending'
      )
      RETURNING id, firebase_uid, email, name, role, status, created_at, last_login_at
    `;

    return Response.json(
      { ok: true, user: insertedUsers[0] },
      { status: 201, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    if (error?.code === '23505') {
      return Response.json(
        { ok: false, error: 'Usuário já cadastrado no Neon' },
        { status: 409, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    console.error('Erro ao cadastrar usuário em /api/admin/users:', error);

    return Response.json(
      { ok: false, error: 'Erro ao cadastrar usuário no Neon' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireAdminUser(request);

    if (!auth.ok) {
      return Response.json(
        { ok: false, error: auth.error },
        { status: auth.status, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const body = await request.json().catch(() => null);
    const id = body?.id;

    if (!id) {
      return Response.json(
        { ok: false, error: 'Identificador do usuário inválido' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const targetRows = await identitySql`
      SELECT id, role, status
      FROM identity_users
      WHERE id = ${id}
      LIMIT 1
    `;
    const target = targetRows[0];

    if (!target) {
      return Response.json(
        { ok: false, error: 'Usuário não encontrado no Neon' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    if (String(target.id) === String(auth.user.id)) {
      return Response.json(
        { ok: false, error: 'Você não pode excluir o próprio acesso administrativo' },
        { status: 409, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const removesActiveAdmin = target.role === 'admin' && target.status === 'active';
    const deletedRows = await identitySql`
      DELETE FROM identity_users
      WHERE id = ${id}
        AND (
          ${removesActiveAdmin}::boolean = FALSE
          OR EXISTS (
            SELECT 1
            FROM identity_users AS other_admin
            WHERE other_admin.id <> ${id}
              AND other_admin.role = 'admin'
              AND other_admin.status = 'active'
          )
        )
      RETURNING id
    `;

    if (!deletedRows[0]) {
      return Response.json(
        { ok: false, error: 'O sistema precisa manter ao menos um administrador ativo' },
        { status: 409, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return Response.json(
      { ok: true, id: deletedRows[0].id },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Erro ao excluir usuário em /api/admin/users:', error);

    return Response.json(
      { ok: false, error: 'Erro ao excluir usuário do Neon' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
