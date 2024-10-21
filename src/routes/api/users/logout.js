// src/routes/api/users/logout.js

import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST({ cookies }) {
  cookies.delete('auth_token', { path: '/' });
  return json({ message: 'Logout successful.' }, { status: 200 });
}
