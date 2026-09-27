import { Request, Response } from 'express';

/** Rails not yet posted through the double-entry ledger. */
export const notOnLedgerYet = (_req: Request, res: Response): void => {
  res.status(501).json({
    success: false,
    code: 'LEDGER_NOT_WIRED',
    message: 'This rail is not posted to the double-entry ledger yet.',
  });
};

/** @deprecated MODE=sim does not exist */
export const retiredInSimulation = notOnLedgerYet;
