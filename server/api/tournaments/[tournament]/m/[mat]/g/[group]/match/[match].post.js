import { getToken, getInviteAuth } from '~/server/utils';

export default defineEventHandler(async (event) => {
  const token = getToken(event);
  if (!token) {
    return createError({ statusCode: 401, message: 'unauthorized' });
  }
  const tournamentId = getRouterParam(event, 'tournament');
  try {
    const { tournament, error } = await getInviteAuth(token, tournamentId);
    if (error) {
      return error;
    }
    const matNumber = parseInt(getRouterParam(event, 'mat'));
    const groupNumber = parseInt(getRouterParam(event, 'group'));
    const matchNumber = parseInt(getRouterParam(event, 'match'));
    const { id, tori, toriId, uke, ukeId } = await readBody(event);
    const updatedMatch = tournament.updateMatch(matNumber, groupNumber, matchNumber, { id, tori, toriId, uke, ukeId });
    if (!updatedMatch) {
      return createError({ statusCode: 400, message: 'data error, match was not updated' });
    }
    await tournament.save();
    return tournament.data;
  } catch (err) {
    return createError({ statusCode: 400, message: err.message });
  }
});
