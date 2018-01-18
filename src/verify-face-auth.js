import Syncano from 'syncano-server';
import { validateRequired } from './utils/helpers';

export default (ctx) => {
  const { response, users } = Syncano(ctx);

  const { username, token } = ctx.args;

  try {
    validateRequired({ username, token });
  } catch (err) {
    const { customMessage, details } = err;
    return response.json({ message: customMessage, details }, 400);
  }

  /**
   * Check if face auth is enabled in user account
   * @param {object} data
   * @returns {*} response
   */
  const verifyUserFaceAuthRegistered = (data) => {
    if (data.user_key !== token) {
      return response.json({
        message: 'Given credentials does not match any user account.'
      }, 401);
    } else if (!data.face_auth) {
      return response.json({
        message: 'Face auth not enabled on user account.', is_face_auth: false
      });
    }

    return response.json({
      message: 'Face auth enabled on user account.', is_face_auth: true
    });
  };

  return users.where('username', username)
    .firstOrFail()
    .then(verifyUserFaceAuthRegistered)
    .catch(() => {
      return response.json({ message: 'Given credentials does not match any user account.' }, 401);
    });
};
