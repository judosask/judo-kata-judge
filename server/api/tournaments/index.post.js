import Invite from '~/server/models/invite';
import Tournament from '~/server/models/tournament';
import { getAuth, getToken } from '~/server/utils';
import { nanoid } from 'nanoid';

export default defineEventHandler(async (event) => {
  const token = getToken(event);
  if (!token) {
    return createError({ statusCode: 401, message: 'unauthorized' });
  }
  if (!getAuth(token)) {
    return createError({ statusCode: 403, message: 'forbidden' });
  }
  try {
    const { name, org, showJudgeTotals } = await readBody(event);
    const invites = { [nanoid(6)]: { use: 'admin' }, [nanoid(6)]: { use: 'public' } };
    const tournament = await Tournament.create({ name, org, showJudgeTotals, invites });
    for (const inviteId of Object.keys(tournament.invites)) {
      await Invite.create({ id: inviteId, tournament: tournament.id, use: tournament.invites[inviteId].use });
    }
    return tournament;
  } catch (err) {
    return createError({ statusCode: 400, message: err.message });
  }
});
