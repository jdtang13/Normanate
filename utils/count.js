/**
 * Quick Word Counting method
 * Taken in part from Countable
 * https://github.com/RadLikeWhoa/Countable
 */

function _decode (string) {
  var output = [],
      counter = 0,
      length = string.length,
      value, extra

  while (counter < length) {
    value = string.charCodeAt(counter++)

    if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
      // High surrogate, and there is a next character.
      extra = string.charCodeAt(counter++)

      if ((extra & 0xFC00) == 0xDC00) {
        // Low surrogate.
        output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000)
      } else {
        // unmatched surrogate; only append this code unit, in case the next
        // code unit is the high surrogate of a surrogate pair
        output.push(value, extra)
        counter--
      }
    } else {
      output.push(value)
    }
  }

  return output
}

function count (string) {
  var original = string;
  var trimmed;

  var options = {
    hardReturns: true,
    stripTags: true,
    ignoreReturns: false,
    ignoreZeroWidth: true
  }

  /**
   * The initial implementation to allow for HTML tags stripping was created
   * @craniumslows while the current one was created by @Rob--W.
   *
   * @see <http://goo.gl/Exmlr>
   * @see <http://goo.gl/gFQQh>
   */

  if (options.stripTags) original = original.replace(/<\/?[a-z][^>]*>/gi, '')
  if (options.ignoreZeroWidth) original = original.replace(/[\u200B]+/, '')

  trimmed = original.trim();

  /**
   * Most of the performance improvements are based on the works of @epmatsw.
   *
   * @see <http://goo.gl/SWOLB>
   */

  return {
    paragraphs: trimmed ? (trimmed.match(options.hardReturns ? /\n{2,}/g : /\n+/g) || []).length + 1 : 0,
    sentences: trimmed ? (trimmed.match(/[.?!…]+./g) || []).length + 1 : 0,
    words: trimmed ? (trimmed.replace(/['";:,.?¿\-!¡]+/g, '').match(/\S+/g) || []).length : 0,
    characters: trimmed ? _decode(trimmed.replace(/\s/g, '')).length : 0,
    all: _decode(options.ignoreReturns ? original.replace(/[\n\r]/g, '') : original).length
  };
}

module.exports = count;