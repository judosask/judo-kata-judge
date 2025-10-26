import { getToken, getInviteAuth } from '~/server/utils';

export default defineEventHandler(async (event) => {
  const token = getToken(event);
  if (!token) {
    return createError({ statusCode: 401, message: 'unauthorized' });
  }
  const tournamentId = getRouterParam(event, 'tournament');
  const { tournament, error } = await getInviteAuth(token, tournamentId);
  if (error) {
    return error;
  }
  tournament.createMat();
  await tournament.save();
  return tournament.data;
});
