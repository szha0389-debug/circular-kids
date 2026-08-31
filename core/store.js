// In-memory case store, used by the local dev API and the worker.
//
// The Vercel deployment swaps this for Neon (api/_db.js) behind the same shape,
// so the request handlers in core/handler.js never learn which one is in play.

import { createRecord, applyUpdate, isExpired } from "./investigation.js";

export function createStore({ now = () => Date.now() } = {}) {
  const records = new Map();

  return {
    async create(id) {
      const record = createRecord(id, now());
      records.set(id, record);
      return record;
    },

    async get(id) {
      const record = records.get(id);
      if (!record) return null;
      if (isExpired(record, now())) {
        records.delete(id);
        return null;
      }
      return record;
    },

    async update(id, input) {
      const record = await this.get(id);
      if (!record) return null;
      return applyUpdate(record, input, now());
    },

    async complete(id) {
      const record = await this.get(id);
      if (!record) return null;
      record.completed = true;
      record.imageStored = false;
      record.updatedAt = now();
      return record;
    }
  };
}
