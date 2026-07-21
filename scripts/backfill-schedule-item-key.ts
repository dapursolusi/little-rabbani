/**
 * Backfill scheduleItem.date and scheduleItem.sessionTypeId from the
 * existing termSession FK. This is the "expand" phase of expand–contract.
 *
 * The term_session table has been dropped (Issue #40). This script is kept
 * for reference only — backfill was run before the contract phase.
 */
async function backfill() {
  console.log(
    'term_session table has been dropped. Backfill no longer needed.'
  );
  console.log('Run: no-op — all data should already be backfilled.');
}

backfill();
