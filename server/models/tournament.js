import { nanoid } from 'nanoid';
import { pick, omit } from 'lodash-es';

import { log } from './cosmos';
import { shimCreate, shimDelete, shimGet, shimGetAll, shimUpdate, shimUpsert } from './dev-shim';

const KEY = 'tournaments';

/**
 * {
 *   id: string
 *   name: string
 *   org: string
 *   numberOfMats: number
 *   showJudgeTotals: boolean
 *   mats: [{
 *     groups: [{
 *       numberOfJudges: number
 *       startTime: string
 *       matches: [{
 *         kata: string
 *         tori: string
 *         uke: string
 *         numberOfJudges: number
 *         completed: boolean
 *         judges: [{
 *           id: string
 *           scores: []
 *         }]
 *       }]
 *     }]
 *   }]
 * }
 */
export default class Tournament {
  #id;
  #tournament;
  #etag;
  constructor(id, data, etag) {
    this.#id = id;
    this.#tournament = pick(data, ['id', 'name', 'org', 'showJudgeTotals', 'mats', 'invites', 'value']);
    this.#etag = etag;
  }

  static async create({ name = 'Tournament 1', org, showJudgeTotals = true }) {
    const id = nanoid(6);
    const tournament = {
      id,
      name,
      org,
      showJudgeTotals,
      mats: [],
      invites: {},
    };
    return await shimCreate(KEY, tournament);
  }

  static async update(id, changes, options) {
    try {
      return await shimUpdate(KEY, id, changes, options);
    } catch (err) {
      if (err.code === 412) {
        log(`attempted to update out of date tournament ${id} with etag ${options._etag}`);
        throw new Error('tournament out of date, refresh and try again');
      } else {
        throw err;
      }
    }
  }

  static async getAll(options) {
    const querySpec = _getAllQuery(options);
    return await shimGetAll(KEY, querySpec);
  }

  static async get(id) {
    const data = await shimGet(KEY, id);
    if (data) {
      return new Tournament(id, data, data._etag);
    }
  }

  static async remove(id) {
    await shimDelete(KEY, id);
  }

  getMat(matNumber) {
    const mat = this.#tournament.mats[matNumber];
    return mat;
  }

  createMat() {
    if (!this.#tournament.mats) {
      this.#tournament.mats = [];
    }
    this.#tournament.mats.push({ groups: [] });
  }

  deleteMat(index) {
    this.#tournament.mats.splice(index, 1);
  }

  addInvite(invite, data = {}) {
    if (!this.#tournament.invites) {
      this.#tournament.invites = {};
    }
    this.#tournament.invites[invite] = data;
  }

  deleteInvite(invite) {
    delete this.#tournament.invites[invite];
  }

  createGroup(mat, data) {
    const group = { id: nanoid(4), matches: [] };
    this.#assignGroupValues(group, data);
    this.#tournament.mats[mat].groups.push(group);
  }

  getGroup(matNumber, groupNumber) {
    const mat = this.#tournament.mats[matNumber];
    if (!mat) {
      return;
    }
    const group = mat.groups[groupNumber];
    if (!group) {
      return;
    }
    return group;
  }

  updateGroup(matNumber, groupNumber, data) {
    const group = this.getGroup(matNumber, groupNumber);
    if (!data.id || data.id !== group.id) {
      return;
    }
    this.#assignGroupValues(group, data);
    return group;
  }

  deleteGroup(mat, group) {
    this.#tournament.mats[mat].groups.splice(group, 1);
  }

  getMatch(matNumber, groupNumber, matchNumber) {
    const mat = this.#tournament.mats[matNumber];
    if (!mat) {
      return;
    }
    const group = mat.groups[groupNumber];
    if (!group) {
      return;
    }
    return group.matches[matchNumber];
  }

  getNextMatch(matNumber) {
    const mat = this.#tournament.mats[matNumber];
    if (!mat) {
      return {};
    }
    for (const [groupIndex, group] of mat.groups.entries()) {
      for (const [matchIndex, match] of group.matches.entries()) {
        if (!match.completed) {
          return { match, group, matchIndex, groupIndex };
        }
      }
    }
    return {};
  }

  createMatch(matNumber, groupNumber, { tori, toriId, uke, ukeId }) {
    const mat = this.#tournament.mats[matNumber];
    if (!mat) {
      return;
    }
    const group = mat.groups[groupNumber];
    if (!group) {
      return;
    }
    const matches = group.matches;
    const match = {
      id: nanoid(),
      tori,
      toriId,
      uke,
      ukeId,
      completed: false,
    };
    matches.push(match);
    return match;
  }

  async updateMatch(matNumber, groupNumber, matchNumber, { id, tori, toriId, uke, ukeId, completed, summary }) {
    const mat = this.#tournament.mats[matNumber];
    if (!mat) {
      return;
    }
    const group = mat.groups[groupNumber];
    if (!group) {
      return;
    }
    const match = group.matches[matchNumber];
    if (!match) {
      return;
    }
    if (!id || id !== match.id) {
      return;
    }
    if (match.completed) {
      return;
    }
    if (tori != null) {
      match.tori = tori;
      match.toriId = toriId;
    }
    if (uke != null) {
      match.uke = uke;
      match.ukeId = ukeId;
    }
    if (completed != null) {
      match.completed = completed;
    }
    if (summary != null) {
      match.summary = summary;
    }
    return match;
  }

  deleteMatch(matNumber, groupNumber, matchNumber) {
    const mat = this.#tournament.mats[matNumber];
    if (!mat) {
      return;
    }
    const group = mat.groups[groupNumber];
    if (!group) {
      return;
    }
    const matches = group.matches;
    return matches.splice(matchNumber, 1)[0];
  }

  get id() {
    return this.#id;
  }

  get data() {
    return { ...this.#tournament, id: this.#id, _etag: this.#etag };
  }

  async save() {
    await shimUpsert(KEY, this.#id, this.#tournament, { _etag: this.#etag });
  }

  update(tournament) {
    if (tournament.name != null) {
      this.#tournament.name = tournament.name;
    }
    if (tournament.org != null) {
      this.#tournament.org = tournament.org;
    }
    if (tournament.showJudgeTotals != null) {
      this.#tournament.showJudgeTotals = tournament.showJudgeTotals;
    }
    if (tournament.completed != null) {
      this.#tournament.completed = tournament.completed;
    }
    if (tournament.mats) {
      this.#tournament.mats = tournament.mats;
    }
  }

  async clone() {
    const thisTournament = this.#tournament;
    const copiedTournament = omit(thisTournament, 'id', 'invites');
    copiedTournament.id = nanoid(6);
    (copiedTournament.mats || []).forEach(mat => {
      (mat.groups || []).forEach(group => {
        group.id = nanoid(4);
        (group.matches || []).forEach(match => {
          match.id = nanoid();
        });
      });
    });
    const newTournament = await shimCreate(KEY, copiedTournament);
    return new Tournament(newTournament.id, newTournament, newTournament._etag);
  }

  #assignGroupValues(group, { name, kata, numberOfJudges, startTime, disableDivideByHalf, disableForgotten, disableMajor }) {
    if (name != null) {
      group.name = name;
    }
    if (kata) {
      group.kata = kata;
    }
    if (numberOfJudges) {
      group.numberOfJudges = parseInt(numberOfJudges);
    }
    if (startTime != null) {
      group.startTime = startTime;
    }
    if (disableDivideByHalf != null) {
      group.disableDivideByHalf = disableDivideByHalf;
    }
    if (disableForgotten != null) {
      group.disableForgotten = disableForgotten;
    }
    if (disableMajor != null) {
      group.disableMajor = disableMajor;
    }
  }
}

function _getAllQuery(options) {
  if (options.org) {
    const parameters = [
      {
        name: '@org',
        value: options.org,
      }
    ];
    if (options.archived) {
      parameters.push({
        name: '@archived',
        value: options.archived || false,
      });
      return {
        query: 'SELECT c.id, c.name, c.org, c.showJudgeTotals, c.complete, c.archived, c._etag FROM c WHERE c.org = @org AND c.archived = @archived',
        parameters,
      };
    } else {
      return {
        query: 'SELECT c.id, c.name, c.org, c.showJudgeTotals, c.complete, c.archived, c._etag FROM c WHERE c.org = @org',
        parameters,
      };
    }
  } else {
    if (options.archived) {
      const parameters = [
        {
          name: '@archived',
          value: options.archived || false,
        }];
      return { query: 'SELECT c.id, c.name, c.org, c.showJudgeTotals, c.complete, c.archived, c._etag FROM c AND c.archived = @archived', parameters };
    } else {
      return { query: 'SELECT c.id, c.name, c.org, c.showJudgeTotals, c.complete, c.archived, c._etag FROM c' };
    }
  }
}
