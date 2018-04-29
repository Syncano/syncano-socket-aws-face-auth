import Syncano from '@syncano/core';
import validateRequired from './utils/helpers';

export default async (ctx) => {
  const { response, users } = new Syncano(ctx);
  const { username, token } = ctx.args;

  try {
    validateRequired({ username, token });

    const result = await users.where('username', username).firstOrFail();

    if (result.user_key !== token) {
      return response.json({ message: 'Given credentials does not match any user account.' }, 401);
    } else if (!result.face_auth) {
      return response.json({ message: 'Face auth not enabled on user account.', is_face_auth: false });
    }

    return response.json({ message: 'Face auth enabled on user account.', is_face_auth: true });
  } catch (err) {
    if (err.statusCode) {
      return response.json(err, err.statusCode);
    }
    return response.json({ message: 'Given credentials does not match any user account.' }, 401);
  }
};
