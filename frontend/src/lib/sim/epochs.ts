/**
 * Epoch catch-up, compounding and fee sweep live in engine.settle().
 * This module is the clock + settlement surface the rest of the desk imports.
 */

export {
  EPOCH_MS,
  EPOCHS_PER_DAY,
  EPOCHS_PER_YEAR,
  GENESIS_TS,
  SEASON_EPOCHS,
  blockHeight,
  currentEpoch,
  epochAt,
  epochStart,
  msUntilNextEpoch,
  seasonBounds,
  seasonOf,
  utcDay,
} from "./clock";

export { settle, type SettlementReport } from "./engine";
