import Match from '~/server/models/match';
import { getInviteAuth, getToken } from '~/server/utils';

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
    const { tori, toriId, uke, ukeId } = await readBody(event);
    const match = await tournament.createMatch(matNumber, groupNumber, { tori, toriId, uke, ukeId });
    await Match.create(match.id);
    await tournament.save();
    return tournament.data;
  } catch (err) {
    return createError({ statusCode: 400, message: err.message });
  }
});
