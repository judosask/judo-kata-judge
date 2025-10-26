import Tournament from '~/server/models/tournament';
import Invite from '~/server/models/invite';
import Match from '~/server/models/match';
import { getAuth, getToken } from '~/server/utils';

export default defineEventHandler(async (event) => {
  const token = getToken(event);
  if (!token) {
    return createError({ statusCode: 401, message: 'unauthorized' });
  }
  if (!getAuth(token)) {
    return createError({ statusCode: 403, message: 'forbidden' });
  }
  try {
    const tournamentId = getRouterParam(event, 'tournament');
    if (!tournamentId) {
      return createError({ statusCode: 404, message: 'Tournament not found' });
    }
    const tournament = await Tournament.get(tournamentId);
    if (!tournament) {
      return createError({ statusCode: 404, message: 'Tournament not found' });
    }
    // delete invites
    for (const inviteId of Object.keys(tournament.data.invites)) {
      try {
        await Invite.remove(inviteId);
      } catch (err) {
        console.log('failed to delete invite', tournament.id, inviteId, err.message);
      }
    }
    // delete matches
    for (const mat of tournament.data.mats) {
      for (const group of mat.groups) {
        for (const match of group.matches) {
          if (match.id) {
            try {
              await Match.remove(match.id);
            } catch (err) {
              console.log('failed to delete match', tournament.id, match.id, err.message);
            }
          }
        }
      }
    }
    await Tournament.remove(tournamentId);
  } catch (err) {
    return createError({ statusCode: 400, message: err.message });
  }
});
