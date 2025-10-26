import Tournament from '~/server/models/tournament';
import { getInviteAuth, getToken } from '~/server/utils';

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
  const { name, org, showJudgeTotals, mats, _etag } = await readBody(event);
  if (!_etag) {
    return createError({ statusCode: 400, message: 'Invalid update data' });
  }
  try {
    return await Tournament.update(tournamentId, { name, org, showJudgeTotals, mats }, { _etag });
  } catch (err) {
    return createError({ statusCode: 400, message: err.message });
  }
});
