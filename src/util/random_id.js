
/**
 * Generate an ascii random ID
 * 
 * @param  {Number} minBytes number of bytes the ID should contain
 * @return {String} a textual ID of `bytes` entropy
 */
export default function randId(minBytes: number) {
    const ret = [];
    for( ; minBytes > 0 ; minBytes -= 4 ) {
        // Make a unique string of pow(2, 32) entropy.
        ret.push( (Math.random()*(-1>>>0)>>>0).toString(36) ); // number in base 36 (to save space)
    }
    return ret.join('');
}
