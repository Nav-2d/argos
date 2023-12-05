import type { Knex } from "knex";
import type { TransactionOrKnex } from "objection";

export { TransactionOrKnex };

type TransactionOrKnexWithPromise = TransactionOrKnex & {
  executionPromise: Promise<any>;
};

const checkIsTransaction = (
  maybeTrx: any,
): maybeTrx is TransactionOrKnexWithPromise => {
  return Boolean(maybeTrx && maybeTrx.executionPromise);
};

let transactionKnexInstance: Knex | null = null;

/**
 * @template T
 * @param {import('objection').TransactionOrKnex | undefined | (trx: import('objection').TransactionOrKnex) => T} trxOrCallback
 * @param {(trx: import('objection').TransactionOrKnex) => T} [maybeCallback]
 * @returns {T}
 */
export const transaction = <TReturn>(
  trxOrCallback:
    | TransactionOrKnex
    | undefined
    | ((trx: TransactionOrKnex) => Promise<TReturn>),
  maybeCallback?: (trx: TransactionOrKnex) => Promise<TReturn>,
): Promise<TReturn> => {
  if (!transactionKnexInstance) {
    throw new Error(`transaction is not initialized`);
  }

  if (maybeCallback === undefined) {
    if (typeof trxOrCallback !== "function") {
      throw new Error(`Invalid transaction call`);
    }
    return transactionKnexInstance.transaction(trxOrCallback);
  }

  if (checkIsTransaction(trxOrCallback)) {
    return maybeCallback(trxOrCallback);
  }
  return transactionKnexInstance.transaction(maybeCallback);
};

transaction.knex = (knexInstance: Knex) => {
  transactionKnexInstance = knexInstance;
};
