const { getRandomBytes } = require('expo-crypto');

const UINT32_RANGE = 0x100000000;

function randomInt(minimum, maximum) {
  if (maximum === undefined) {
    maximum = minimum;
    minimum = 0;
  }

  if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum) || maximum <= minimum) {
    throw new RangeError('randomInt requires a non-empty safe integer range');
  }

  const range = maximum - minimum;
  if (range > UINT32_RANGE) {
    throw new RangeError('randomInt range must not exceed 2^32');
  }

  const limit = Math.floor(UINT32_RANGE / range) * range;
  let value;

  do {
    const bytes = getRandomBytes(4);
    value =
      bytes[0] * 0x1000000 +
      bytes[1] * 0x10000 +
      bytes[2] * 0x100 +
      bytes[3];
  } while (value >= limit);

  return minimum + (value % range);
}

module.exports = { randomInt };
