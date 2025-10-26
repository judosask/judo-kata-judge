import { nanoid } from 'nanoid';
import { pick } from 'lodash-es';

import Tournament from './tournament';
import { shimCreate, shimDelete, shimGet } from './dev-shim';

const EXPIRY_SECONDS = 60 * 60 * 24 * 7 * 365; // roughly 1 year

const KEY = 'invites';

export default class Invite {
  static async create({ id, tournament, use }) {
    if (!id) {
      id = nanoid(6);
    }
    const ts = Date.now();
    const invite = {
      id,
      tournament,
      use,
      exp: ts + (EXPIRY_SECONDS),
    }
    const data = await shimCreate(KEY, invite);
    return pick(data, ['id', 'tournament', 'exp']);
  }

  static async get(id) {
    const data = await shimGet(KEY, id);
    if (data) {
      return pick(data, ['id', 'tournament', 'use', 'exp']);
    }
  }

  static async remove(id) {
    await shimDelete(KEY, id);
  }

  static async getTournament(id) {
    const invite = await Invite.get(id);
    if (!invite) {
      throw new Error('Link not found');
    }
    const { tournament: tournamentId, use } = invite;
    if (!tournamentId) {
      throw new Error('Link not found');
    }
    if ((use || 'public') === 'admin') {
      throw new Error('Link not found')
    }
    // optionally check exp here1
    const tournament = await Tournament.get(tournamentId);
    if (!tournament) {
      throw new Error('Link not found');
    }
    return tournament;
  }
}
