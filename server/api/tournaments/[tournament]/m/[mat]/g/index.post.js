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
    const matNumber = getRouterParam(event, 'mat');
    const { numberOfJudges, name, kata, startTime, disableDivideByHalf, disableForgotten, disableMajor } = await readBody(event);
    tournament.createGroup(matNumber, { name, kata, numberOfJudges, startTime, disableDivideByHalf, disableForgotten, disableMajor });
    await tournament.save();
    return tournament.data;
  } catch (err) {
    return createError({ statusCode: 400, message: err.message });
  }
});
