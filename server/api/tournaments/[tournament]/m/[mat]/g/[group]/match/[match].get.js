import { pick } from 'lodash-es';

import Match from '~/server/models/match';
import { getInviteAuth, getToken, matchDataToScores } from '~/server/utils';

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

    const group = tournament.getGroup(matNumber, groupNumber);
    const match = tournament.getMatch(matNumber, groupNumber, matchNumber);

    const matchData = await Match.get(match.id);
    if (!matchData) {
      return createError({ statusCode: 404, message: 'Match info not found' });
    }

    const scores = matchDataToScores(matchData, group);
    return {
      ...match,
      scores,
      tournament: pick(tournament.data, ['name', 'org']),
      kata: group.kata,
      numberOfJudges: match.completed ? scores.length : group.numberOfJudges,
      disableMajor: group.disableMajor,
      disableForgotten: group.disableForgotten,
      disableDivideByHalf: group.disableDivideByHalf,
    };
  } catch (err) {
    return createError({ statusCode: 400, message: err.message });
  }
});
