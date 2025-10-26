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
    const { id, numberOfJudges, name, kata, startTime, disableDivideByHalf, disableForgotten, disableMajor } = await readBody(event);
    const updatedGroup = tournament.updateGroup(matNumber, groupNumber, { id, name, kata, numberOfJudges, startTime, disableDivideByHalf, disableForgotten, disableMajor });
    if (!updatedGroup) {
      return createError({ statusCode: 400, message: 'data error, group was not updated' });
    }
    await tournament.save();
    return tournament.data;
  } catch (err) {
    return createError({ statusCode: 400, message: err.message });
  }
});
