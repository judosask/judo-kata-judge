import { getToken, getInviteAuth } from '~/server/utils';

export default defineEventHandler(async (event) => {
  const tournamentId = getRouterParam(event, 'tournament');
  const token = getToken(event);
  if (!token) {
    return createError({ statusCode: 401, message: 'unauthorized' });
  }
  try {
    const { tournament, error } = await getInviteAuth(token, tournamentId);
    if (error) {
      return error;
    }
    return tournament.data;
  } catch (err) {
    return createError({ statusCode: 400, message: err.message });
  }

});
