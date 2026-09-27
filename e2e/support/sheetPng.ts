// Thin re-export so the Playwright suite can import the fixture from the same
// place as the unit tests.

export {
  cellColor,
  createSheetPng,
  FIXTURE_CELL,
  FIXTURE_CELLS,
  FIXTURE_COLS,
  FIXTURE_CORE,
  FIXTURE_HEIGHT,
  FIXTURE_ROWS,
  FIXTURE_WIDTH,
  type SheetOptions,
} from '../../src/testUtils/fixtureSheet';
