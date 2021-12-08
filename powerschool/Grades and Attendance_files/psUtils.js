/*global define:false*/
'use strict';
/**
 * A collection of *generic* JavaScript utility methods.
 *
 * Note:
 *    This file should contain only functions that are truly global and generic.  If a function is applicable to a specific page, or even just a few pages, it does NOT belong here.
 *
 *    When new functions are added, appropriate unit tests MUST be added, too.  These are located in:
 *        /web_root/scripts/test/unit/shared/utils/psUtils.test.js
 */
define(function(require) {
    var _ = require('underscore');
    var RGB_REGEX = /^rgb\(\s*([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\s*,\s*([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\s*,\s*([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\s*\)$|^rgba\(\s*([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\s*,\s*([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\s*,\s*([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\s*,\s*(0(?:\.[0-9]+)?|1(?:\.0)?)?\s*\)$/i;
    var RGB_TRANSPARENT_REGEX = /^rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)$/i;

    // jshint freeze:false
    if (!String.prototype.startsWith) {
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
        String.prototype.endsWith = function(searchString, position) {
            var subjectString = this.toString();
            if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
                position = subjectString.length;
            }
            position -= searchString.length;
            var lastIndex = subjectString.indexOf(searchString, position);
            return lastIndex !== -1 && lastIndex === position;
        };
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
        String.prototype.startsWith = function(searchString, position) {
            position = position || 0;
            return this.indexOf(searchString, position) === position;
        };
    }
    // jshint freeze:true

    var utils = {
        ACCENTED_ALPHABET_CASE:   'AÁÀȦÂÄǍĂĀÃÅĄǠǺǞȀȂBCĆĊĈČÇDĎĐǱǲEÉÈĖÊËĚĔĒĘȨȄȆFGǴĠĜǦĞĢHĤȞĦIÍÌİÎÏǏĬĪĨĮȈȊĲJĴKǨĶLĹĿĽĻǇǈMNŃǸŇÑŅǊǋOÓÒȮÔÖǑŎŌÕǪŐØȰȪǾȬǬȌȎƠŒPQRŔŘŖȐȒSŚŜŠŞȘTŤŢȚUÚÙÛÜǓŬŪŨŮŲŰǗǛǙǕȔȖƯVWŴXYÝŶŸȲZŹŻŽaáàȧâäǎăāãåąǡǻǟȁȃbcćċĉčçdďđʤǳʥeéèėêëěĕēęȩȅȇfgǵġĝǧğģhʰĥȟħiíìîïǐĭīĩįȉȋĳjĵǰkǩķlĺŀľļłǉmnńǹňñņǌoóòȯôöǒŏōõǫőøȱȫǿȭǭȍȏơœpqrŕřŗȑȓsśŝšşșßtťţțʧʨʦŧuúùûüǔŭūũůųűǘǜǚǖȕȗưvwŵxyýŷÿȳzźżžÆǢǼǣǽæÐðŁŊŋŦƀƂƃƇƈƋƌƑƒƘƙƚƞƤƥƫƬƭƳƴƵƶǤǥǅǄǆȠȡȤȥȴȵȶȷȸȹȺȻȼȽȾȿɀɃɄɆɇɈɉɊɋɌɍɎɏƁɓɕɖƉƊɗɟƓɠɦƗɨɫɬɭɮƝɲɳƟɵɼɽɾʂʄƮʈʉƲʋʐʑʝʠʩʪʫᵫ',
        ACCENTED_ALPHABET_NOCASE: 'AaÁáÀàȦȧÂâÄäǍǎĂăĀāÃãÅåĄąǠǡǺǻǞǟȀȁȂȃBbCcĆćĊċĈĉČčÇçDdĎďĐđʤǱǲǳʥEeÉéÈèĖėÊêËëĚěĔĕĒēĘęȨȩȄȅȆȇFfGgǴǵĠġĜĝǦǧĞğĢģHhʰĤĥȞȟĦħIiÍíÌìİÎîÏïǏǐĬĭĪīĨĩĮįȈȉȊȋĲĳJjĴĵǰKkǨǩĶķLlĹĺĿŀĽľĻļłǇǈǉMmNnŃńǸǹŇňÑñŅņǊǋǌOoÓóÒòȮȯÔôÖöǑǒŎŏŌōÕõǪǫŐőØøȰȱȪȫǾǿȬȭǬǭȌȍȎȏƠơŒœPpQqRrŔŕŘřŖŗȐȑȒȓSsŚśŜŝŠšŞşȘșßTtŤťŢţȚțʧʨʦŧUuÚúÙùÛûÜüǓǔŬŭŪūŨũŮůŲųŰűǗǘǛǜǙǚǕǖȔȕȖȗƯưVvWwŴŵXxYyÝýŶŷŸÿȲȳZzŹźŻżŽžÆǢǣǽǼæðÐŁŊŋŦƀƂƃƇƈƋƌƑƒƘƙƚƞƤƥƫƬƭƳƴƵƶǤǥǅǄǆȠȡȤȥȴȵȶȷȸȹȺȻȼȽȾȿɀɃɄɆɇɈɉɊɋɌɍɎɏƁɓɕɖƉƊɗɟƓɠɦƗɨɫɬɭɮƝɲɳƟɵɼɽɾʂʄƮʈʉƲʋʐʑʝʠʩʪʫᵫ',
        ACCENTED_ALPHABET_EQUIV_FROM: 'ÁÀȦÂÄǍĂĀÃÅĄǠǺǞȀȂČÇĆĊĈĎĐǱǲÉÈĖÊËĚĔĒĘȨȄȆǴĠĜǦĞĢĤȞĦÍÌİÎÏǏĬĪĨĮȈȊĲĴǨĶĹĿĽĻǇǈŃǸŇÑŅǊǋȮÔÖÓÒǑŎŌÕǪŐØȰȪǾȬǬȌȎƠŒŔŘŖȐȒŚŜŠŞȘŤŢȚÚÙÛÜǓŬŪŨŮŲŰǗǛǙǕȔȖƯŴÝŶŸȲŹŻŽáàȧâäǎăāãåąǡǻǟȁȃčçćċĉďđʤǳʥéèėêëěĕēęȩȅȇǵġĝǧğģʰĥȟħíìîïǐĭīĩįȉȋĳĵǰǩķĺŀľļǉńǹňñņǌȯôöóòǒŏōõǫőøȱȫǿȭǭȍȏơœŕřŗȑȓśŝšşșßťţțʧʨʦúùûüǔŭūũůųűǘǜǚǖȕȗưŵýŷÿȳźżžÆǢǼǣǽæðÐŁŋŊŦƀƃƂƇƈƋƌƑƒƘƙƚƞƤƥƫƬƭƳƴƵƶǤǥǅǄǆȠȡȤȥȴȵȶȷȸȹȺȻȼȽȾȿɀɃɄɆɇɈɉɊɋɌɍɎɏɓƁɕɖƉƊɗɟƓɠɦƗɨɫɬɭɮƝɲɳƟɵɼɽɾʂʄƮʈʉƲʋʐʑʝʠʩʪʫᵫ',   //List of all the accented character
        ACCENTED_ALPHABET_EQUIV_TO:   'AAAAAAAAAAAAAAAACCCCCDDDDEEEEEEEEEEEEGGGGGGHHHIIIIIIIIIIIIIJKKLLLLLLNNNNNNNOOOOOOOOOOOOOOOOOOOOORRRRRRSSSSTTTUUUUUUUUUUUUUUUUUUWYYYYZZZaaaaaaaaaaaaaaaacccccdddddeeeeeeeeeeeegggggghhhhiiiiiiiiiiiijjkklllllnnnnnnooooooooooooooooooooorrrrrssssssttttttuuuuuuuuuuuuuuuuuuwyyyyzzzÆÆÆæææðÐŁŋŊŦƀƃƂƇƈƋƌƑƒƘƙƚƞƤƥƫƬƭƳƴƵƶǤǥǅǄǆȠȡȤȥȴȵȶȷȸȹȺȻȼȽȾȿɀɃɄɆɇɈɉɊɋɌɍɎɏɓƁɕɖƉƊɗɟƓɠɦƗɨɫɬɭɮƝɲɳƟɵɼɽɾʂʄƮʈʉƲʋʐʑʝʠʩʪʫᵫ',   //Equivalent base character of the above list
        ACCENTED_CHARACTERS_MAP : new Map(),
        /*
            The following characters cannot be used for a custom alphabet. naturalCompare() only works for characters that are 2-bytes long.
            The reason is String.charAt() only reads 1 or 2-byte characters. It cannot properly handle 3 or 4-byte characters.

            Accented Alphabet (3 bytes)
            --------------------------------
            ẤẦẮẰẪẴẢẨẲẠḀẬẶⱥấầắằẫẵảẩẳᶏạḁậẚặ
            ḂḄḆḃᵬᶀḅḇ
            C̈C̄Ḉc̈c̄ḉ
            ḊḐḌD̦ḒḎḋᵭḑᶁḍᶑd̦ḓḏ
            ẼẾỀḖḔỄḜẺỂẸE̩ḘḚỆẽếềḗḕễḝẻểẹᶒe̩ḙḛệ
            Ḟḟᵮᶂﬁﬂ
            Ḡḡᶃ
            ḢḦḨḤḪH̱Ⱨḣḧḩḥḫẖⱨ
            ḮỈỊḬᵻḯỉịᶖḭ
            J̌
            ḰḲḴⱩḱᶄᶄḳḵⱪ
            ⱢⱠḶḼḺḸⱡᶅḷḽḻḹ
            ḾṀṂḿṁᵯᶆṃ
            ṄN̈ṆṊṈṅn̈ᵰᶇṇṋṉ
            ỐỒṒṐṌ[Ō̂]ỖṎỎỔỌỚỜỠỘỞỢốồṓṑṍ[ō̂]ỗṏỏổọớờỡộởợ
            ṔṖP̃Ᵽṕṗp̃ᵱᵽᶈ
            q̃
            ṘⱤṚṞṜṙᵲᵳᶉṛṟṝ
            ṠS̈ṤṦṢS̩Ṩẞṡs̈ᵴṥṧᶊṣs̩ṩ
            ṪT̈ṬṰṮṫẗᵵṭṱṯⱦ
            ṸṺỦỤṲỨỪṶṴỮỬỰᵾṹṻủᶙụṳứừṷṵữửự
            ṼṾṽᶌṿⱴ
            ẂẀẆẄW̊Ẉẃẁẇẅẘẉ
            ẊẌẋẍᶍ
            ỲẎỸỶỴỳẏỹẙỷỵ
            ẐẒẔⱫẑᵶᶎẓẕⱬ

            Accented Alphabet (4 bytes)
            --------------------------------
            Ō̂ō̂
        */

        debug: false,

        /**
         * Returns the specified value as an Array, if it is not already one.  When a value is returned from a REST call, sometimes there is only one element so it parses into a value
         * that isn't an array.  By calling this function, the results of the REST call can be guaranteed to be returned as an Array, even if the original vlaue is empty or null.
         */
        asArray: function(value) {
            var result;
            if (utils.isUndefinedOrNull(value)) {
                result = [];
            }
            else if (_.isArray(value)) {
                result = value;
            }
            else if (_.isArguments(value)) {
                result = [];
                _.each(value, function(v) {
                    result.push(v);
                });
            }
            else {
                result = [value];
            }
            return result;
        },

        /**
         * Returns the specified value as an boolean, returning true only when isTrue() returns true; all other values return false.
         * @see isTrue()
         */
        asBoolean: function(value) {
            return utils.isTrue(value);
        },

        /**
         * Gets the named parameters of a function.
         * @param functionPointer The function in which to look up the parameter names.  This must be a reference to the function itself, not just the function name.
         * @return An array of the function's named parameters
         * @throws An exception if the functionPointer is null or undefined
         * @see http://stackoverflow.com/questions/1007981/how-to-get-function-parameter-names-values-dynamically-from-javascript
         */
        getFunctionParameters: function(functionPointer) {
            var argType = utils.getVariableType(functionPointer);
            if (argType === 'Function') {
                var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
                var ARGUMENT_NAMES = /([^\s,]+)/g;
                var str = functionPointer.toString().replace(STRIP_COMMENTS, '');
                var result = str.slice(str.indexOf('(') + 1, str.indexOf(')')).match(ARGUMENT_NAMES);
                if (result === null) {
                    result = [];
                }
                return result;
            }
            throw 'Attempting to read function parameters, but the functionPointer parameter type is: ' + argType;
        },

        /**
         * Returns a formatted key and value as a valid JSON string.
         * Note: if the resulting JSON string is not empty, a comma will be appended.  This allows for easily constructing a JSON object, as done within autoCalendarRec.js [see toJson()].
         * @param key The name of the key
         * @param value The value (can be null)
         * @param returnOnlyIf A flag, that when false (as defined by the isFalse() function), returns an empty string, otherwise returns the JSON string (allows for conditional includes)
         * @return A JSON string containing the specified key and value
         */
        getJsonValue: function(key, value, returnOnlyIf) {
            var result;
            var valueType = utils.getVariableType(value);
            switch (valueType) {
                case 'Function':
                case 'Infinity':
                case 'NaN':
                    value = null;
                    break;
                case 'Element':
                    value = (!utils.isUndefinedOrNull(value.value) ? value.value : value.innerText);
                    break;
                case 'RegExp':
                    value = value.toString();
                    break;
            }
            if (utils.isFalse(returnOnlyIf)) {
                result = '';
            }
            else {
                result = '"' + key + '": ';
                if (valueType === 'Arguments') {
                    result += JSON.stringify(utils.asArray(value));
                }
                else {
                    result += (utils.isUndefinedOrNull(value) ? 'null' : JSON.stringify(value));
                }
                result += ',';
            }
            return result;
        },

        /**
         * Evaluates the specified value and returns a string representing its actual type.
         * @param value The value to be checked
         * @return Based on the actual type of the specified value, one of the following strings will be returned:
         * <li>{null}</li>
         * <li>{undefined}</li>
         * <li>Arguments</li>
         * <li>Array</li>
         * <li>Boolean</li>
         * <li>Date</li>
         * <li>Element</li>
         * <li>Function</li>
         * <li>Infinity</li>
         * <li>NaN</li>
         * <li>Number</li>
         * <li>Object</li>
         * <li>RegExp</li>
         * <li>String</li>
         */
        getVariableType: function(value) {
            var result = '{unknown}';
            if (_.isNull(value)) {
                result = '{null}';
            }
            else if (_.isUndefined(value)) {
                result = '{undefined}';
            }
            else if (_.isArguments(value)) {
                result = 'Arguments';
            }
            else if (_.isArray(value)) {
                result = 'Array';
            }
            else if (_.isBoolean(value)) {
                result = 'Boolean';
            }
            else if (_.isDate(value)) {
                result = 'Date';
            }
            else if (_.isElement(value)) {
                result = 'Element';
            }
            else if (_.isFunction(value)) {
                result = 'Function';
            }
            else if (_.isNumber(value)) {
                result = (_.isNaN(value) ? 'NaN' : _.isFinite(value) ? 'Number' : 'Infinity');
            }
            else if (_.isRegExp(value)) {
                result = 'RegExp';
            }
            else if (_.isString(value)) {
                result = 'String';
            }
            else {
                // keep this check last, because technically everything is an object
                result = 'Object';
            }
            return result;
        },

        /**
         * Checks the specified value to determine if it is not undefined or null and also not blank (when trimmed).
         * @param value The value to be checked
         * @return true if the specified value is not undefined or null, and also not blank (or just whitespace); otherwise false.
         *
         * The formula used to evaluate each variable type is:
         * <li>{null}      - always returns false</li>
         * <li>{undefined} - always returns false</li>
         * <li>NaN         - always returns false</li>
         * <li>Arguments   - true if value.length > 0</li>
         * <li>Array       - true if value.length > 0</li>
         * <li>Element     - passes Element.value back into this method</li>
         * <li>Boolean     - always returns true</li>
         * <li>Date        - always returns true</li>
         * <li>Function    - always returns true</li>
         * <li>Infinity    - always returns true</li>
         * <li>Object      - always returns true</li>
         * <li>Number      - always returns true</li>
         * <li>RegExp      - always returns true</li>
         * <li>String      - true if value.trim().length > 0</li>
         * <li>{unknown}   - always returns false</li>
         */
        hasValue: function(value) {
            var valType = utils.getVariableType(value);
            var result;
            switch (valType) {
                case '{null}':
                case '{undefined}':
                case 'NaN':
                    result = false;
                    break;
                case 'Arguments':
                case 'Array':
                    result = (value.length > 0);
                    break;
                case 'Element':
                    result = utils.hasValue(value.value);
                    break;
                case 'Boolean':
                case 'Date':
                case 'Function':
                case 'Infinity':
                case 'Object':
                case 'Number':
                case 'RegExp':
                    result = true;
                    break;
                case 'String':
                    result = (value.trim().length > 0);
                    break;
            }
            return result;
        },

        /**
         * Converts any commonly used HTML Entity to the equivalent Char Code.
         * @param value is the value containing HTML Entities, and can be String, Object, or Array. Any other variable type is ignored and returned.
         * @return the value after all conversions have been completed.
         * @throws An exception if the value is an Object and is not in valid JSON notation.
         */
        htmlEntitiesToCharCode: function(value) {
            var translate = {
                '&quot;': String.fromCharCode(34),       // Quotation mark. Not required
                '&amp;': String.fromCharCode(38),        // Ampersand. Applied before everything else in the application
                '&lt;': String.fromCharCode(60),         // Less-than sign
                '&gt;': String.fromCharCode(62),         // Greater-than sign
                '&nbsp;': String.fromCharCode(160),      // Non-breaking space
                '&iexcl;': String.fromCharCode(161),     // Inverted exclamation mark
                '&cent;': String.fromCharCode(162),      // Cent sign
                '&pound;': String.fromCharCode(163),     // Pound sign
                '&curren;': String.fromCharCode(164),    // Currency sign
                '&yen;': String.fromCharCode(165),       // Yen sign
                '&brvbar;': String.fromCharCode(166),    // Broken vertical bar
                '&sect;': String.fromCharCode(167),      // Section sign
                '&uml;': String.fromCharCode(168),       // Diaeresis
                '&copy;': String.fromCharCode(169),      // Copyright sign
                '&ordf;': String.fromCharCode(170),      // Feminine ordinal indicator
                '&laquo;': String.fromCharCode(171),     // Left-pointing double angle quotation mark
                '&not;': String.fromCharCode(172),       // Not sign
                '&shy;': String.fromCharCode(173),       // Soft hyphen
                '&reg;': String.fromCharCode(174),       // Registered sign
                '&macr;': String.fromCharCode(175),      // Macron
                '&deg;': String.fromCharCode(176),       // Degree sign
                '&plusmn;': String.fromCharCode(177),    // Plus-minus sign
                '&sup2;': String.fromCharCode(178),      // Superscript two
                '&sup3;': String.fromCharCode(179),      // Superscript three
                '&acute;': String.fromCharCode(180),     // Acute accent
                '&micro;': String.fromCharCode(181),     // Micro sign
                '&para;': String.fromCharCode(182),      // Pilcrow sign
                '&middot;': String.fromCharCode(183),    // Middle dot
                '&cedil;': String.fromCharCode(184),     // Cedilla
                '&sup1;': String.fromCharCode(185),      // Superscript one
                '&ordm;': String.fromCharCode(186),      // Masculine ordinal indicator
                '&raquo;': String.fromCharCode(187),     // Right-pointing double angle quotation mark
                '&frac14;': String.fromCharCode(188),    // Vulgar fraction one-quarter
                '&frac12;': String.fromCharCode(189),    // Vulgar fraction one-half
                '&frac34;': String.fromCharCode(190),    // Vulgar fraction three-quarters
                '&iquest;': String.fromCharCode(191),    // Inverted question mark
                '&Agrave;': String.fromCharCode(192),    // A with grave
                '&Aacute;': String.fromCharCode(193),    // A with acute
                '&Acirc;': String.fromCharCode(194),     // A with circumflex
                '&Atilde;': String.fromCharCode(195),    // A with tilde
                '&Auml;': String.fromCharCode(196),      // A with diaeresis
                '&Aring;': String.fromCharCode(197),     // A with ring above
                '&AElig;': String.fromCharCode(198),     // AE
                '&Ccedil;': String.fromCharCode(199),    // C with cedilla
                '&Egrave;': String.fromCharCode(200),    // E with grave
                '&Eacute;': String.fromCharCode(201),    // E with acute
                '&Ecirc;': String.fromCharCode(202),     // E with circumflex
                '&Euml;': String.fromCharCode(203),      // E with diaeresis
                '&Igrave;': String.fromCharCode(204),    // I with grave
                '&Iacute;': String.fromCharCode(205),    // I with acute
                '&Icirc;': String.fromCharCode(206),     // I with circumflex
                '&Iuml;': String.fromCharCode(207),      // I with diaeresis
                '&ETH;': String.fromCharCode(208),       // Eth
                '&Ntilde;': String.fromCharCode(209),    // N with tilde
                '&Ograve;': String.fromCharCode(210),    // O with grave
                '&Oacute;': String.fromCharCode(211),    // O with acute
                '&Ocirc;': String.fromCharCode(212),     // O with circumflex
                '&Otilde;': String.fromCharCode(213),    // O with tilde
                '&Ouml;': String.fromCharCode(214),      // O with diaeresis
                '&times;': String.fromCharCode(215),     // Multiplication sign
                '&Oslash;': String.fromCharCode(216),    // O with stroke
                '&Ugrave;': String.fromCharCode(217),    // U with grave
                '&Uacute;': String.fromCharCode(218),    // U with acute
                '&Ucirc;': String.fromCharCode(219),     // U with circumflex
                '&Uuml;': String.fromCharCode(220),      // U with diaeresis
                '&Yacute;': String.fromCharCode(221),    // Y with acute
                '&THORN;': String.fromCharCode(222),     // Thorn
                '&szlig;': String.fromCharCode(223),     // Sharp s. Also known as ess-zed
                '&agrave;': String.fromCharCode(224),    // a with grave
                '&aacute;': String.fromCharCode(225),    // a with acute
                '&acirc;': String.fromCharCode(226),     // a with circumflex
                '&atilde;': String.fromCharCode(227),    // a with tilde
                '&auml;': String.fromCharCode(228),      // a with diaeresis
                '&aring;': String.fromCharCode(229),     // a with ring above
                '&aelig;': String.fromCharCode(230),     // ae. Also known as ligature ae
                '&ccedil;': String.fromCharCode(231),    // c with cedilla
                '&egrave;': String.fromCharCode(232),    // e with grave
                '&eacute;': String.fromCharCode(233),    // e with acute
                '&ecirc;': String.fromCharCode(234),     // e with circumflex
                '&euml;': String.fromCharCode(235),      // e with diaeresis
                '&igrave;': String.fromCharCode(236),    // i with grave
                '&iacute;': String.fromCharCode(237),    // i with acute
                '&icirc;': String.fromCharCode(238),     // i with circumflex
                '&iuml;': String.fromCharCode(239),      // i with diaeresis
                '&eth;': String.fromCharCode(240),       // eth
                '&ntilde;': String.fromCharCode(241),    // n with tilde
                '&ograve;': String.fromCharCode(242),    // o with grave
                '&oacute;': String.fromCharCode(243),    // o with acute
                '&ocirc;': String.fromCharCode(244),     // o with circumflex
                '&otilde;': String.fromCharCode(245),    // o with tilde
                '&ouml;': String.fromCharCode(246),      // o with diaeresis
                '&divide;': String.fromCharCode(247),    // Division sign
                '&oslash;': String.fromCharCode(248),    // o with stroke. Also known as o with slash
                '&ugrave;': String.fromCharCode(249),    // u with grave
                '&uacute;': String.fromCharCode(250),    // u with acute
                '&ucirc;': String.fromCharCode(251),     // u with circumflex
                '&uuml;': String.fromCharCode(252),      // u with diaeresis
                '&yacute;': String.fromCharCode(253),    // y with acute
                '&thorn;': String.fromCharCode(254),     // thorn
                '&yuml;': String.fromCharCode(255),      // y with diaeresis
                '&#264;': String.fromCharCode(264),      // Latin capital letter C with circumflex
                '&#265;': String.fromCharCode(265),      // Latin small letter c with circumflex
                '&OElig;': String.fromCharCode(338),     // Latin capital ligature OE
                '&oelig;': String.fromCharCode(339),     // Latin small ligature oe
                '&Scaron;': String.fromCharCode(352),    // Latin capital letter S with caron
                '&scaron;': String.fromCharCode(353),    // Latin small letter s with caron
                '&#372;': String.fromCharCode(372),      // Latin capital letter W with circumflex
                '&#373;': String.fromCharCode(373),      // Latin small letter w with circumflex
                '&#374;': String.fromCharCode(374),      // Latin capital letter Y with circumflex
                '&#375;': String.fromCharCode(375),      // Latin small letter y with circumflex
                '&Yuml;': String.fromCharCode(376),      // Latin capital letter Y with diaeresis
                '&fnof;': String.fromCharCode(402),      // Latin small f with hook, function, florin
                '&circ;': String.fromCharCode(710),      // Modifier letter circumflex accent
                '&tilde;': String.fromCharCode(732),     // Small tilde
                '&Alpha;': String.fromCharCode(913),     // Alpha
                '&Beta;': String.fromCharCode(914),      // Beta
                '&Gamma;': String.fromCharCode(915),     // Gamma
                '&Delta;': String.fromCharCode(916),     // Delta
                '&Epsilon;': String.fromCharCode(917),   // Epsilon
                '&Zeta;': String.fromCharCode(918),      // Zeta
                '&Eta;': String.fromCharCode(919),       // Eta
                '&Theta;': String.fromCharCode(920),     // Theta
                '&Iota;': String.fromCharCode(921),      // Iota
                '&Kappa;': String.fromCharCode(922),     // Kappa
                '&Lambda;': String.fromCharCode(923),    // Lambda
                '&Mu;': String.fromCharCode(924),        // Mu
                '&Nu;': String.fromCharCode(925),        // Nu
                '&Xi;': String.fromCharCode(926),        // Xi
                '&Omicron;': String.fromCharCode(927),   // Omicron
                '&Pi;': String.fromCharCode(928),        // Pi
                '&Rho;': String.fromCharCode(929),       // Rho
                '&Sigma;': String.fromCharCode(931),     // Sigma
                '&Tau;': String.fromCharCode(932),       // Tau
                '&Upsilon;': String.fromCharCode(933),   // Upsilon
                '&Phi;': String.fromCharCode(934),       // Phi
                '&Chi;': String.fromCharCode(935),       // Chi
                '&Psi;': String.fromCharCode(936),       // Psi
                '&Omega;': String.fromCharCode(937),     // Omega
                '&alpha;': String.fromCharCode(945),     // alpha
                '&beta;': String.fromCharCode(946),      // beta
                '&gamma;': String.fromCharCode(947),     // gamma
                '&delta;': String.fromCharCode(948),     // delta
                '&epsilon;': String.fromCharCode(949),   // epsilon
                '&zeta;': String.fromCharCode(950),      // zeta
                '&eta;': String.fromCharCode(951),       // eta
                '&theta;': String.fromCharCode(952),     // theta
                '&iota;': String.fromCharCode(953),      // iota
                '&kappa;': String.fromCharCode(954),     // kappa
                '&lambda;': String.fromCharCode(955),    // lambda
                '&mu;': String.fromCharCode(956),        // mu
                '&nu;': String.fromCharCode(957),        // nu
                '&xi;': String.fromCharCode(958),        // xi
                '&omicron;': String.fromCharCode(959),   // omicron
                '&pi;': String.fromCharCode(960),        // pi
                '&rho;': String.fromCharCode(961),       // rho
                '&sigmaf;': String.fromCharCode(962),    // sigmaf
                '&sigma;': String.fromCharCode(963),     // sigma
                '&tau;': String.fromCharCode(964),       // tau
                '&upsilon;': String.fromCharCode(965),   // upsilon
                '&phi;': String.fromCharCode(966),       // phi
                '&chi;': String.fromCharCode(967),       // chi
                '&psi;': String.fromCharCode(968),       // psi
                '&omega;': String.fromCharCode(969),     // omega
                '&thetasym;': String.fromCharCode(977),  // Theta symbol
                '&upsih;': String.fromCharCode(978),     // Greek upsilon with hook symbol
                '&piv;': String.fromCharCode(982),       // Pi symbol
                '&ensp;': String.fromCharCode(8194),     // En space
                '&emsp;': String.fromCharCode(8195),     // Em space
                '&thinsp;': String.fromCharCode(8201),   // Thin space
                '&zwnj;': String.fromCharCode(8204),     // Zero width non-joiner
                '&zwj;': String.fromCharCode(8205),      // Zero width joiner
                '&lrm;': String.fromCharCode(8206),      // Left-to-right mark
                '&rlm;': String.fromCharCode(8207),      // Right-to-left mark
                '&ndash;': String.fromCharCode(8211),    // En dash
                '&mdash;': String.fromCharCode(8212),    // Em dash
                '&lsquo;': String.fromCharCode(8216),    // Left single quotation mark
                '&rsquo;': String.fromCharCode(8217),    // Right single quotation mark
                '&sbquo;': String.fromCharCode(8218),    // Single low-9 quotation mark
                '&ldquo;': String.fromCharCode(8220),    // Left double quotation mark
                '&rdquo;': String.fromCharCode(8221),    // Right double quotation mark
                '&bdquo;': String.fromCharCode(8222),    // Double low-9 quotation mark
                '&dagger;': String.fromCharCode(8224),   // Dagger
                '&Dagger;': String.fromCharCode(8225),   // Double dagger
                '&bull;': String.fromCharCode(8226),     // Bullet
                '&hellip;': String.fromCharCode(8230),   // Horizontal ellipsis
                '&permil;': String.fromCharCode(8240),   // Per mille sign
                '&prime;': String.fromCharCode(8242),    // Prime
                '&Prime;': String.fromCharCode(8243),    // Double Prime
                '&lsaquo;': String.fromCharCode(8249),   // Single left-pointing angle quotation
                '&rsaquo;': String.fromCharCode(8250),   // Single right-pointing angle quotation
                '&oline;': String.fromCharCode(8254),    // Overline
                '&frasl;': String.fromCharCode(8260),    // Fraction Slash
                '&euro;': String.fromCharCode(8364),     // Euro sign
                '&image;': String.fromCharCode(8465),    // Script capital
                '&weierp;': String.fromCharCode(8472),   // Blackletter capital I
                '&real;': String.fromCharCode(8476),     // Blackletter capital R
                '&trade;': String.fromCharCode(8482),    // Trade mark sign
                '&alefsym;': String.fromCharCode(8501),  // Alef symbol
                '&larr;': String.fromCharCode(8592),     // Leftward arrow
                '&uarr;': String.fromCharCode(8593),     // Upward arrow
                '&rarr;': String.fromCharCode(8594),     // Rightward arrow
                '&darr;': String.fromCharCode(8595),     // Downward arrow
                '&harr;': String.fromCharCode(8596),     // Left right arrow
                '&crarr;': String.fromCharCode(8629),    // Downward arrow with corner leftward. Also known as carriage return
                '&lArr;': String.fromCharCode(8656),     // Leftward double arrow. ISO 10646 does not say that lArr is the same as the 'is implied by' arrow but also does not have any other character for that function. So ? lArr can be used for 'is implied by' as ISOtech suggests
                '&uArr;': String.fromCharCode(8657),     // Upward double arrow
                '&rArr;': String.fromCharCode(8658),     // Rightward double arrow. ISO 10646 does not say this is the 'implies' character but does not have another character with this function so ? rArr can be used for 'implies' as ISOtech suggests
                '&dArr;': String.fromCharCode(8659),     // Downward double arrow
                '&hArr;': String.fromCharCode(8660),     // Left-right double arrow
                // Mathematical Operators
                '&forall;': String.fromCharCode(8704),   // For all
                '&part;': String.fromCharCode(8706),     // Partial differential
                '&exist;': String.fromCharCode(8707),    // There exists
                '&empty;': String.fromCharCode(8709),    // Empty set. Also known as null set and diameter
                '&nabla;': String.fromCharCode(8711),    // Nabla. Also known as backward difference
                '&isin;': String.fromCharCode(8712),     // Element of
                '&notin;': String.fromCharCode(8713),    // Not an element of
                '&ni;': String.fromCharCode(8715),       // Contains as member
                '&prod;': String.fromCharCode(8719),     // N-ary product. Also known as product sign. Prod is not the same character as U+03A0 'greek capital letter pi' though the same glyph might be used for both
                '&sum;': String.fromCharCode(8721),      // N-ary summation. Sum is not the same character as U+03A3 'greek capital letter sigma' though the same glyph might be used for both
                '&minus;': String.fromCharCode(8722),    // Minus sign
                '&lowast;': String.fromCharCode(8727),   // Asterisk operator
                '&#8729;': String.fromCharCode(8729),    // Bullet operator
                '&radic;': String.fromCharCode(8730),    // Square root. Also known as radical sign
                '&prop;': String.fromCharCode(8733),     // Proportional to
                '&infin;': String.fromCharCode(8734),    // Infinity
                '&ang;': String.fromCharCode(8736),      // Angle
                '&and;': String.fromCharCode(8743),      // Logical and. Also known as wedge
                '&or;': String.fromCharCode(8744),       // Logical or. Also known as vee
                '&cap;': String.fromCharCode(8745),      // Intersection. Also known as cap
                '&cup;': String.fromCharCode(8746),      // Union. Also known as cup
                '&int;': String.fromCharCode(8747),      // Integral
                '&there4;': String.fromCharCode(8756),   // Therefore
                '&sim;': String.fromCharCode(8764),      // tilde operator. Also known as varies with and similar to. The tilde operator is not the same character as the tilde, U+007E, although the same glyph might be used to represent both
                '&cong;': String.fromCharCode(8773),     // Approximately equal to
                '&asymp;': String.fromCharCode(8776),    // Almost equal to. Also known as asymptotic to
                '&ne;': String.fromCharCode(8800),       // Not equal to
                '&equiv;': String.fromCharCode(8801),    // Identical to
                '&le;': String.fromCharCode(8804),       // Less-than or equal to
                '&ge;': String.fromCharCode(8805),       // Greater-than or equal to
                '&sub;': String.fromCharCode(8834),      // Subset of
                '&sup;': String.fromCharCode(8835),      // Superset of. Note that nsup, 'not a superset of, U+2283' is not covered by the Symbol font encoding and is not included.
                '&nsub;': String.fromCharCode(8836),     // Not a subset of
                '&sube;': String.fromCharCode(8838),     // Subset of or equal to
                '&supe;': String.fromCharCode(8839),     // Superset of or equal to
                '&oplus;': String.fromCharCode(8853),    // Circled plus. Also known as direct sum
                '&otimes;': String.fromCharCode(8855),   // Circled times. Also known as vector product
                '&perp;': String.fromCharCode(8869),     // Up tack. Also known as orthogonal to and perpendicular
                '&sdot;': String.fromCharCode(8901),     // Dot operator. The dot operator is not the same character as U+00B7 middle dot
                // Miscellaneous Technical
                '&lceil;': String.fromCharCode(8968),    // Left ceiling. Also known as an APL upstile
                '&rceil;': String.fromCharCode(8969),    // Right ceiling
                '&lfloor;': String.fromCharCode(8970),   // left floor. Also known as APL downstile
                '&rfloor;': String.fromCharCode(8971),   // Right floor
                '&lang;': String.fromCharCode(9001),     // Left-pointing angle bracket. Also known as bra. Lang is not the same character as U+003C 'less than'or U+2039 'single left-pointing angle quotation mark'
                '&rang;': String.fromCharCode(9002),     // Right-pointing angle bracket. Also known as ket. Rang is not the same character as U+003E 'greater than' or U+203A 'single right-pointing angle quotation mark'
                // Geometric Shapes
                '&#9642;': String.fromCharCode(9642),    // Black small square
                '&#9643;': String.fromCharCode(9643),    // White small square
                '&loz;': String.fromCharCode(9674),      // Lozenge
                // Miscellaneous Symbols
                '&#9702;': String.fromCharCode(9702),    // White bullet
                '&spades;': String.fromCharCode(9824),   // Black (filled) spade suit
                '&clubs;': String.fromCharCode(9827),    // Black (filled) club suit. Also known as shamrock
                '&hearts;': String.fromCharCode(9829),   // Black (filled) heart suit. Also known as shamrock
                '&diams;': String.fromCharCode(9830),    // Black (filled) diamond suit
            };
            var translateKeys = _.keys(translate);
            var joinedKeys = translateKeys.join('|').replace(/&/g, '').replace(/;/g, '');
            var translateRegex = new RegExp('&(' + joinedKeys + ');', 'g');
            if (utils.getVariableType(value) === 'String') {
                return value.replace(translateRegex, function(match) {
                    return translate[match];
                });
            }
            else if (utils.getVariableType(value) === 'Object') {
                var JSONstring = JSON.stringify(value).replace(translateRegex, function(match) {
                    return translate[match];
                });
                return JSON.parse(JSONstring);
            }
            else if (utils.getVariableType(value) === 'Array') {
                //Arrays may contain a JSON or String so recursively call function.
                _.each(value, function(val, index, list) {
                    list[index] = utils.htmlEntitiesToCharCode(val);
                });
                return value;
            }
            else {
                return value;
            }
        },

        /**
         * Checks the specified value is relevant boolean value.
         * @param value The value to be checked
         * @return true if the specified value is any of the following values (case-insensitive):
         * <ul>
         *   <li>active</li>
         *   <li>disabled</li>
         *   <li>enabled</li>
         *   <li>f</li>
         *   <li>false</li>
         *   <li>inactive</li>
         *   <li>n</li>
         *   <li>no</li>
         *   <li>off</li>
         *   <li>on</li>
         *   <li>t</li>
         *   <li>true</li>
         *   <li>y</li>
         *   <li>yes</li>
         *   <li>any numeric</li>
         * </ul>
         */
        isBoolean: function(value) {
            return utils.isTrue(value) || utils.isFalse(value);
        },

        /**
         * Checks the specified value to determine if it is considered to be empty (undefined or null or blank, when trimmed).
         * @param value The value to be checked
         * @return true if the specified value is undefined or null or blank (or just whitespace); otherwise false.
         *
         * The formula used to evaluate each variable type is:
         * <li>{null}      - always returns true</li>
         * <li>{undefined} - always returns true</li>
         * <li>NaN         - always returns true</li>
         * <li>Arguments   - true if value.length = 0</li>
         * <li>Array       - true if value.length = 0</li>
         * <li>Element     - passes Element.value back into this method</li>
         * <li>Boolean     - always returns false</li>
         * <li>Date        - always returns false</li>
         * <li>Function    - always returns false</li>
         * <li>Infinity    - always returns false</li>
         * <li>Object      - always returns false</li>
         * <li>Number      - always returns false</li>
         * <li>RegExp      - always returns false</li>
         * <li>String      - true if value.trim().length = 0</li>
         * <li>{unknown}   - always returns false</li>
         */
        isEmpty: function(value) {
            var valType = utils.getVariableType(value);
            var result;
            switch (valType) {
                case '{null}':
                case '{undefined}':
                case 'NaN':
                    result = true;
                    break;
                case 'Arguments':
                case 'Array':
                    result = (value.length === 0);
                    break;
                case 'Element':
                    result = utils.isEmpty(value.value);
                    break;
                case 'Boolean':
                case 'Date':
                case 'Function':
                case 'Infinity':
                case 'Object':
                case 'Number':
                case 'RegExp':
                    result = false;
                    break;
                case 'String':
                    result = (value.trim().length === 0);
                    break;
            }
            return result;
        },

        /**
         * Checks the specified value is false.
         * @param value The value to be checked
         * @return true if the specified value is any of the following values (case-insensitive):
         * <ul>
         *   <li>disabled</li>
         *   <li>f</li>
         *   <li>false</li>
         *   <li>inactive</li>
         *   <li>n</li>
         *   <li>no</li>
         *   <li>off</li>
         *   <li>0</li>
         * </ul>
         */
        isFalse: function(value) {
            var result = false;
            if (utils.hasValue(value)) {
                var str = value.toString().trim().toLowerCase();
                var valueType = utils.getVariableType(value);
                var numValue = Number(value);
                result = ((((valueType === 'String' && _.isNumber(numValue) && !_.isNaN(numValue)) || valueType === 'Number') && numValue === 0) ||
                    str === 'disabled' || str === 'f'  || str === 'false' || str === 'inactive' || str === 'n' || str === 'no' || str === 'off');
            }
            return result;
        },

        /**
         * Returns true if a mobile browser is in use.
         * All mobile browser checking should call here so that we can change the way we detect mobile users
         * as well as identify areas where we do this easily.
         *
         * This method should be used as a last resort! For example, events which need to be
         * called for mobile users in order to provide a good user experience but harm the desktop experience.
         */
        isMobile: function() {
            return !utils.isUndefinedOrNull(window.orientation);
        },

        /**
         * Checks the specified value is true.
         * @param value The value to be checked
         * @return true if the specified value is any of the following values (case-insensitive):
         * <ul>
         *   <li>active</li>
         *   <li>enabled</li>
         *   <li>on</li>
         *   <li>t</li>
         *   <li>true</li>
         *   <li>y</li>
         *   <li>yes</li>
         *   <li>numeric, but not 0</li>
         * </ul>
         */
        isTrue: function(value) {
            var result = false;
            if (utils.hasValue(value)) {
                var str = value.toString().trim().toLowerCase();
                var valueType = utils.getVariableType(value);
                var numValue = Number(value);
                result = ((((valueType === 'String' && _.isNumber(numValue) && !_.isNaN(numValue)) || valueType === 'Number') && numValue !== 0) ||
                    str === 'active' || str === 'enabled'  || str === 'on' || str === 't' || str === 'true' || str === 'y' || str === 'yes');
            }
            return result;
        },

        /**
         * Checks the specified value to determine if it is either undefined or null.
         * @param value The value to be checked
         * @return true if the specified value is either undefined or null, otherwise false.
         */
        isUndefinedOrNull: function(value) {
            // using double equals here (instead of triple) allows for checking both null and undefined
            // Go here (http://contribute.jquery.org/style-guide/js/) and search for "only exception"
            // Go here (http://stackoverflow.com/questions/2559318/how-to-check-for-an-undefined-or-null-variable-in-javascript) for proof this is the accepted "best" way to check for both
            return (value == null);
        },

        /**
         * Compares two values using a recursive natural order (default is ascending order).  Options are available for descending order, ignoring the letter case and using a custom alphabet.
         *
         * The typical use of this function is as a parameter to an Array's sort() method, such as:
         *      var z = ['File-10', 'File-12', 'File-20', 'File-2', 'File-21', 'File-100', 'File-99', 'File-1'];
         *      z.sort()                       --> ["File-1", "File-10", "File-100", "File-12", "File-2", "File-20", "File-21", "File-99"]
         *      z.sort(psUtils.naturalCompare) --> ["File-1", "File-2", "File-10", "File-12", "File-20", "File-21", "File-99", "File-100"]
         *
         * NOTE: There is a known issue where sorting a simple array that contain undefined values, these values are never passed into the compare function by the browser.
         *       This results in the undefined values always appearing last after the sort.  One work-around is to have the values in an object and the array contains the objects.
         *
         * @param a The first value to compare
         * @param b The second value to compare
         * @see naturalCompareOptions for configuration options
         */
        naturalCompare: function(a, b) {
            if (utils.naturalCompareOptions.key !== null) {
                var keyType = utils.getVariableType(utils.naturalCompareOptions.key);
                if (keyType === 'String') {
                    a = utils.resolve(utils.naturalCompareOptions.key, a);
                    b = utils.resolve(utils.naturalCompareOptions.key, b);
                }
                else if (keyType === 'Function') {
                    var keyFunc = utils.naturalCompareOptions.key;
                    a = keyFunc(a);
                    b = keyFunc(b);
                }
                else {
                    console.warn('Unsupported type for naturalCompareOptions.key: ' + keyType);
                    return 0;
                }
            }
            var ignoreCase = utils.isTrue(utils.naturalCompareOptions.isIgnoreCase);
            var alphabet = (ignoreCase && utils.hasValue(utils.naturalCompareOptions.alphabetNoCase) ? utils.naturalCompareOptions.alphabetNoCase : utils.naturalCompareOptions.alphabetCase);
            var isAscending = !utils.isFalse(utils.naturalCompareOptions.isAscending);
            var result;
            var i = 0;
            var codeA;
            var codeB = 1;
            var posA = 0;
            var posB = 0;
            var getCode = function(str, pos, code) {
                if (str === '') {
                    return 1;
                }
                if (code) {
                    for (i = pos; code = getCode(str, i), code < 76 && code > 65;) {
                        ++i;
                    }
                    return parseInt(str.slice(pos - 1, i), 10);
                }
                code = alphabet && alphabet.indexOf(str.charAt(pos));
                if (str.charAt(pos) === '') {
                    return 0;
                }
                return (utils.hasValue(code) && code > -1) ? code + 76 : ((code = str.charCodeAt(pos)), code < 45 || code > 127) ? code
                    : code < 46 ? 65          // -
                    : code < 48 ? code - 1
                    : code < 58 ? code + 18   // 0-9
                    : code < 65 ? code - 11
                    : code < 91 ? code + 11   // A-Z
                    : code < 97 ? code - 37
                    : code < 123 ? code + 5   // a-z
                    : code - 63;
            };
            var isPseudoNullA = false;
            var isPseudoNullB = false;
            if (utils.isTrue(utils.naturalCompareOptions.isEmptyAsNull)) {
                isPseudoNullA = (!utils.isUndefinedOrNull(a) && !utils.hasValue(a));
                isPseudoNullB = (!utils.isUndefinedOrNull(b) && !utils.hasValue(b));
            }
            if (utils.isUndefinedOrNull(a) || utils.isUndefinedOrNull(b) || isPseudoNullA || isPseudoNullB) {
                var nulls = utils.naturalCompareOptions.nulls;
                if ((a === undefined && b === undefined) || (a === null && b === null)) {
                    result = 0;
                }
                else if (a === undefined) {
                    result = ((b === null || isPseudoNullB) ? -1 :
                              nulls === 'first'             ? -1 :
                              nulls === 'last'              ? 1 :
                              nulls === 'desc'              ? (isAscending ? 1 : -1) :
                              /* default */                   (isAscending ? -1 : 1)
                    );
                }
                else if (b === undefined) {
                    result = ((a === null || isPseudoNullA) ? 1 :
                              nulls === 'first'             ? 1 :
                              nulls === 'last'              ? -1 :
                              nulls === 'desc'              ? (isAscending ? -1 : 1) :
                              /* default */                   (isAscending ? 1 : -1)
                    );
                }
                else if (isPseudoNullA && isPseudoNullB) {
                    result = a.localeCompare(b);
                }
                else if (a === null || isPseudoNullA) {
                    result = (b === null        ? 1 :
                              isPseudoNullB     ? -1 :
                              nulls === 'first' ? -1 :
                              nulls === 'last'  ? 1 :
                              nulls === 'desc'  ? (isAscending ? 1 : -1) :
                              /* default */       (isAscending ? -1 : 1)
                    );
                }
                else {
                    result = (nulls === 'first' ? 1 :
                              nulls === 'last'  ? -1 :
                              nulls === 'desc'  ? (isAscending ? -1 : 1) :
                              /* default */       (isAscending ? 1 : -1)
                    );
                }
                return result;
            }
            // convert date to number
            if (_.isDate(a) && _.isDate(b)) {
                a = a.getTime();
                b = b.getTime();
            }
            else {
                // convert string A to number?
                if (_.isString(a)) {
                    var numA = parseFloat(a);
                    if (!_.isNaN(numA)) {
                        // coercion needed here
                        /* jshint eqeqeq:false */
                        if (a == numA && a.length === numA.toString().length) {
                            a = numA;
                        }
                        /* jshint eqeqeq:true */
                    }
                }
                // convert string B to number?
                if (_.isString(b)) {
                    var numB = parseFloat(b);
                    if (!_.isNaN(numB)) {
                        // coercion needed here
                        /* jshint eqeqeq:false */
                        if (b == numB && b.length === numB.toString().length) {
                            b = numB;
                        }
                        /* jshint eqeqeq:true */
                    }
                }
            }
            if (_.isNumber(a) && _.isNumber(b)) {
                result = (a === b ? 0 : (a < b) ? -1 : 1);
                if (!isAscending && result !== 0) {
                    result *= -1;
                }
                return result;
            }
            else {
                // using coercion below to handle identity instead of equality (comparing integers to strings)
                a += '';
                b += '';
                if (a !== b) {
                    if (ignoreCase && !utils.hasValue(alphabet)) {
                        a = a.toLowerCase();
                        b = b.toLowerCase();
                    }
                    for (var idx = 0; codeB; idx++) {
                        codeA = getCode(a, posA++);
                        codeB = getCode(b, posB++);
                        var posACharEquiv = utils.ACCENTED_CHARACTERS_MAP.get(a.charAt(posA-1));
                        var posBCharEquiv = utils.ACCENTED_CHARACTERS_MAP.get(b.charAt(posB-1));
                        /*
                            If both of the characters are accented and are derived from same base character
                            Then we move to the next character to decide the sort order
                        */
                        if(posACharEquiv != undefined && posBCharEquiv != undefined && posACharEquiv.toLowerCase() === posBCharEquiv.toLowerCase()) {
                            codeB = codeA;
                        }
                        /*
                            If any of the character is accented and its base character matches the other character or its lower case (which is non-accented)
                            Then we move to the next character to decide the sort order
                        */
                        else if((posACharEquiv != undefined && posACharEquiv.toLowerCase() === b.charAt(posB-1).toLowerCase()) ||
                            (posBCharEquiv != undefined && posBCharEquiv.toLowerCase() === a.charAt(posA-1).toLowerCase())){
                            codeB = codeA;
                        }
                        if (codeA < 76 && codeB < 76 && codeA > 66 && codeB > 66) {
                            codeA = getCode(a, posA, posA);
                            codeB = getCode(b, posB, posA = i);
                            posB = i;
                        }
                        if (ignoreCase && Math.abs(codeA - codeB) === 1 && a.charAt(posA-1).toLocaleLowerCase() === b.charAt(posB-1).toLocaleLowerCase()) {
                            codeB = codeA;
                        }
                        if (codeA !== codeB) {
                            result = (codeA < codeB) ? -1 : 1;
                            if (!isAscending) {
                                result *= -1;
                            }
                            return result;
                        }
                    }
                }
                return 0;
            }
        },

        /**
         * A configuration object to be used with naturalCompare.  Available options are:
         *      alphabetCase (String) an optional String containing the full list of characters, in the desired order for case-sensitivity.
         *      alphabetNoCase (String) an optional String containing the full list of characters, in the desired order for case-insensitivity.
         *          Estonian (case)   - "ABDEFGHIJKLMNOPRSŠZŽTUVÕÄÖÜXYabdefghijklmnoprsšzžtuvõäöüxy"
         *          Estonian (nocase) - "AaBbDdEeFfGgHhIiJjKkLlMmNnOoPpRrSsŠšZzŽžTtUuVvÕõÄäÖöÜüXxYy"
         *          Russian (case)    - "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя"
         *          Russian (nocase)  - "АаБбВвГгДдЕеЁёЖжЗзИиЙйКкЛлМмНнОоПпРрСсТтУуФфХхЦцЧчШшЩщЪъЫыЬьЭэЮюЯя"
         *      isAscending (boolean) a flag to indicate if the sort should be in ascending order
         *      isEmptyAsNull (boolean) a flag to indicate blank (or only white-space) values will be treated as null
         *      isIgnoreCase (boolean) a flag to indicate if the case of the letters should be ignored
         *      nulls (String) - how to handle undefined and null values in the sort order (undefined values are always before null values) - defaults to 'asc'
         *          first - null values are always first
         *          last  - null values are always last
         *          asc   - null values are first for ascending order and last for descending order (default)
         *          desc  - null values are last for ascending order and first for descending order
         */
        naturalCompareOptions: {
            alphabetCase: null,
            alphabetNoCase: null,
            isAscending: null,
            isEmptyAsNull: null,
            isIgnoreCase: null,
            key: null,
            nulls: null,
            saved: {},
            clearKey: function() {
                this.key = null;
            },
            ascending: function() {
                this.isAscending = true;
            },
            descending: function() {
                this.isAscending = false;
            },
            ignoreCase: function() {
                this.isIgnoreCase = true;
            },
            nullsAsc: function() {
                this.nulls = 'asc';
            },
            nullsDesc: function() {
                this.nulls = 'desc';
            },
            nullsFirst: function() {
                this.nulls = 'first';
            },
            nullsLast: function() {
                this.nulls = 'last';
            },
            reset: function() {
                this.clearKey();
                this.setAlphabet(utils.ACCENTED_ALPHABET_CASE, utils.ACCENTED_ALPHABET_NOCASE);
                this.setEmptyAsNull();
                this.setAscending();
                this.setIgnoreCase();
                this.setNulls();
                this.setAccentedCharMap();
            },
            restore: function(options) {
                if (utils.isUndefinedOrNull(options) || !_.isObject(options)) {
                    options = {};
                }
                var alphaCase = (options.hasOwnProperty('alphabetCase') ? options.alphabetCase : this.saved.alphabetCase);
                var alphaNoCase = (options.hasOwnProperty('alphabetNoCase') ? options.alphabetNoCase : this.saved.alphabetNoCase);
                this.setAlphabet(alphaCase, alphaNoCase);
                this.setAscending(options.hasOwnProperty('isAscending') ? options.isAscending : this.saved.isAscending);
                this.setEmptyAsNull(options.hasOwnProperty('isEmptyAsNull') ? options.isEmptyAsNull : this.saved.isEmptyAsNull);
                this.setIgnoreCase(options.hasOwnProperty('isIgnoreCase') ? options.isIgnoreCase : this.saved.isIgnoreCase);
                this.setNulls(options.hasOwnProperty('nulls') ? options.nulls : this.saved.nulls);
                this.setKey(options.hasOwnProperty('key') ? options.key : this.saved.key);
            },
            save: function() {
                delete this.saved;
                this.saved = JSON.parse(JSON.stringify(this));
                return this.saved;
            },
            setAccentedCharMap: function(){
                for(var loopIndex = 0; loopIndex < utils.ACCENTED_ALPHABET_EQUIV_FROM.length ; loopIndex++){
                    utils.ACCENTED_CHARACTERS_MAP.set(utils.ACCENTED_ALPHABET_EQUIV_FROM.charAt(loopIndex), utils.ACCENTED_ALPHABET_EQUIV_TO.charAt(loopIndex));
                }
            },
            setAlphabet: function(strCase, strNoCase) {
                this.alphabetCase = (utils.hasValue(strCase) ? strCase : null);
                this.alphabetNoCase = (utils.hasValue(strNoCase) ? strNoCase : null);
            },
            setAscending: function(value) {
                this.isAscending = !utils.isFalse(value);
            },
            setEmptyAsNull: function(value) {
                this.isEmptyAsNull = utils.isTrue(value);
            },
            setIgnoreCase: function(value) {
                this.isIgnoreCase = utils.isTrue(value);
            },
            setKey: function(value) {
                if (utils.hasValue(value)) {
                    var keyType = utils.getVariableType(value);
                    if (keyType === 'String' || keyType === 'Function') {
                        this.key = value;
                    }
                    else {
                        console.warn('Invalid value for natural compare key: ' + keyType + ' --> ' + value);
                        this.key = null;
                    }
                }
            },
            setNulls: function(value) {
                if (utils.isUndefinedOrNull(value) || utils.getVariableType(value) !== 'String') {
                    value = 'asc';
                }
                value = value.toLowerCase();
                this.nulls = (value === 'desc' || value === 'first' || value === 'last' ? value : 'asc');
            },
            useCase: function() {
                this.isIgnoreCase = false;
            }
        },

        /**
         * Sorts an array containing JavaScript objects, returning a new instance of the array sorted on the specified (nested) key.
         * Notes:
         *    The key cannot be nested within other objects (top-level). --> this is now supported as of 12/20/2017
         *    If "arr" is not an array, it will be returned.
         * @param arr The array to be sorted
         * @param key (String) The name of the key within the object (supports multiple/nested levels - e.g.  myObj.innerData.someObj.myField)
         *                The string version is a quick way to sort objects on only one key, using the values from naturalCompareOptions.
         *            or
         *            (Array) An array containing the names of the key(s) within the object
         *                The array version allows for sorting on multiple keys, and optionally using different values than what is in naturalCompareOptions.
         *                For an array, the names may be <b>prefixed</b> with any of the character(s) shown below to allow different sort options per key.
         *                The order of the characters does not matter as long as they appear BEFORE the name of the key.
         *                Multiple characters may be used for each key, such as: ['-*?}lastName', '?>amount']
         *                    -   (sort descending, see naturalCompareOptions.isAscending)
         *                    +   (sort ascending [allowed but not required], see naturalCompareOptions.isAscending)
         *                    *   (case-insensitive, see naturalCompareOptions.isIgnoreCase)
         *                    ?   (treat empty as null, see naturalCompareOptions.isEmptyAsNull)
         *                    {   (nulls first, see naturalCompareOptions.nulls)
         *                    }   (nulls last, see naturalCompareOptions.nulls)
         *                    <   (nulls ascending, see naturalCompareOptions.nulls)
         *                    >   (nulls descending, see naturalCompareOptions.nulls)
         */
        naturalSort: function(arr, key) {
            function sortOnFields(fields) {
                return function(a, b) {
                    return fields.map(function(key) {
                        var result;
                        var keyType = utils.getVariableType(key);
                        if (utils.isUndefinedOrNull(key) || (keyType !== 'String' && keyType !== 'Function')) {
                            console.warn('Invalid key type (' + utils.getVariableType(key) + ') in keys.');
                            result = 0;
                        }
                        else {
                            var savedSortOptions = utils.naturalCompareOptions.save();
                            if (keyType === 'String') {
                                var checkModifier = true;
                                while (checkModifier) {
                                    var modifier = key[0];
                                    switch (modifier) {
                                        case '-':
                                            utils.naturalCompareOptions.descending();
                                            break;
                                        case '+':
                                            utils.naturalCompareOptions.ascending();
                                            break;
                                        case '*':
                                            utils.naturalCompareOptions.ignoreCase();
                                            break;
                                        case '?':
                                            utils.naturalCompareOptions.setEmptyAsNull(true);
                                            break;
                                        case '{':
                                            utils.naturalCompareOptions.nullsFirst();
                                            break;
                                        case '}':
                                            utils.naturalCompareOptions.nullsLast();
                                            break;
                                        case '<':
                                            utils.naturalCompareOptions.nullsAsc();
                                            break;
                                        case '>':
                                            utils.naturalCompareOptions.nullsDesc();
                                            break;
                                        default:
                                            checkModifier = false;
                                            break;
                                    }
                                    if (checkModifier) {
                                        key = key.substring(1);
                                    }
                                }
                                result = utils.naturalCompare(utils.resolve(key, a), utils.resolve(key, b));
                            }
                            else {
                                // key here is actual a function reference
                                result = utils.naturalCompare(key(a), key(b));
                            }
                            utils.naturalCompareOptions.restore(savedSortOptions);
                        }
                        return result;
                    })
                    .reduce(function firstNonZeroValue(p, n) {
                        return (p ? p : n);
                    }, 0);
                };
            }
            var result;
            if (_.isArray(arr)) {
                var hasObject = false;
                var hasPrimitive = false;
                _.each(arr, function(o) {
                    var varType = utils.getVariableType(o);
                    if (varType === 'Object') {
                        hasObject = true;
                    }
                    else {
                        hasPrimitive = true;
                    }
                });
                var clonedArr = _.clone(arr);
                if (hasObject && !hasPrimitive) {
                    if (utils.hasValue(key) && _.isArray(key)) {
                        var origSavedOptions = JSON.parse(JSON.stringify(utils.naturalCompareOptions.saved));
                        var origOptions = utils.naturalCompareOptions.save();
                        utils.naturalCompareOptions.clearKey();
                        result = clonedArr.sort(sortOnFields(key));
                        utils.naturalCompareOptions.restore(origOptions);
                        utils.naturalCompareOptions.saved = origSavedOptions;
                    }
                    else {
                        utils.naturalCompareOptions.setKey(key);
                        result = clonedArr.sort(utils.naturalCompare);
                    }
                }
                else if (!hasObject && hasPrimitive) {
                    utils.naturalCompareOptions.setKey(key);
                    result = clonedArr.sort(utils.naturalCompare);
                }
                else if (!hasObject && !hasPrimitive) {
                    result = arr;
                }
                else {
                    throw 'Unable to sort an array containing both primitives and objects.';
                }
            }
            else {
                result = arr;
            }
            return result;
        },

        /**
         * Resolves the requested property within the specified object.
         * @param path the path of the property within the specified object
         * @param obj the objetc from which to resolve the property
         * @return the object value referenced by path, or undefined/null (as appropriate)
         * For example :
         * obj = { assignmentName : 'Test assignment', dueDate : '17/07/2018'}
         * Then, resolve('dueDate', obj) -> '17/07/2018'
         * and resolve('assignmentName', obj) -> 'Test assignment'
         */
        resolve: function (path, obj) {
            if (utils.isUndefinedOrNull(obj)) {
                return obj;
            }
            else if (utils.isUndefinedOrNull(path)) {
                return path;
            }
            else if (!utils.hasValue(path)) {
                return undefined;
            }
            return path.split('.').reduce(function(prev, curr) {
                return (prev ? prev[curr] : null);
            }, obj);
        },

        /**
         * Converts an rgb value from a jquery css lookup to a hex value.
         * Notes:
         *    The value must be in the format of "rgb(#,#,#,?)" or "rgba(#,#,#,?)"
         *    The first three parameters within the rgb() must be in the range of 0 to 255.
         *    The fourth parameter within the rgb() is optional and must be in the range of 0.0 to 1.0.
         *    Spaces anywhere within the rgb() are optional.
         * @param value A string value containing an rgb() or rgba() expression
         * @param upper A boolean flag to indicate if the results should be returned in upper-case
         * @return A string for use as an HTML color in hex format, such as - "#a1b2c3"
         * @throws An exception if the value does not conform to RGB_REGEX
         */
        rgb2hex: function(value, upper) {
            var result;
            if (utils.hasValue(value) && utils.getVariableType(value) === 'String') {
                if (value.search(/rgb/i) === -1) {
                    result = value;
                }
                else if (value.match(RGB_TRANSPARENT_REGEX)) {
                    result = 'transparent';
                }
                else {
                    var matched = value.match(RGB_REGEX);
                    if (matched) {
                        // rgb use captures 1-3, rgba use captures 4-7
                        var idx;
                        if (!utils.isUndefinedOrNull(matched[1])) {
                            idx = 1;
                        }
                        else {
                            idx = 4;
                        }
                        result = '#' + utils.toHex(matched[idx], upper) + utils.toHex(matched[++idx], upper) + utils.toHex(matched[++idx], upper);
                    }
                    else {
                        throw 'Unable to convert non-conforming rgb() value: [' + value + ']';
                    }
                }
            }
            return result;
        },

        /**
         * A custom exception object to be used by runFunctionByProxy().
         * @param error The error message explaining why the exception was caused
         * @param configData A cloned copy of the configData object that was originally passed into runFunctionByProxy()
         */
        RunFunctionException: function(error, configData) {
            this.error = error;
            configData.error = error;
            this.configData = configData;
        },

        /**
         * Executes the specified function, applying any (optional) arguments.
         * @param functionPointer The function to be executed.  This must be a reference to the function itself, not just the function name.
         * @param args (optional) Arguments to be passed to the function to execute
         * @param thisContext (optional) The context of "this" in which to execute the specified function.  This is really only used when the specified function references "this" within it.
         * @throws A RunFunctionException if the value for functionPointer is not a function
         */
        runFunction: function(functionPointer, args, thisContext) {
            if (_.isFunction(functionPointer)) {
                var argsType = utils.getVariableType(args);
                var result;
                if (argsType === '{undefined}') {
                    result = functionPointer.apply(thisContext, null);
                }
                else {
                    result = functionPointer.apply(thisContext, [args]);
                }
                return result;
            }
            else {
                var msg = 'Attempting to run a function, but the functionPointer parameter type is: ';
                throw new this.RunFunctionException(msg + utils.getVariableType(functionPointer), {});
            }
        },

        /**
         * Runs a function by proxy.  Typically this will be from one Angular module to an Angular widget/module.
         * @param objId The internal object ID of the receiving widget/module (because multiple could receive the incoming Angular event)
         * @param authorizedFunctions An array of authorized function names/pointers
         * @param configData A configuration object describing which function is being requested, along with parameters and callback information
         * @throws A RunFunctionException if any of the parameters are null or undefined
         * @throws A RunFunctionException if any of the required internal values within configData are null or undefined
         * @return A cloned copy of configData, that contains results and any error
         * @see http://confluence.powerschool.com/display/ESOP/Angular+Widgets+-+Best+practices%2C+how-to+and+SOP
         */
        runFunctionByProxy: function(objId, authorizedFunctions, configData) {
            var errInvalid = 'runFunctionByProxy() - invalid value specified for: ';
            var errRequested = 'runFunctionByProxy() - requested ';
            if (utils.isUndefinedOrNull(configData)) {
                throw new this.RunFunctionException(errInvalid + 'configData', {});
            }
            var data = _.clone(configData);
            data.error = null;
            if (utils.isUndefinedOrNull(objId)) {
                throw new this.RunFunctionException(errInvalid + 'objId', data);
            }
            if (utils.isUndefinedOrNull(authorizedFunctions)) {
                throw new this.RunFunctionException(errInvalid + 'authorizedFunctions', data);
            }
            if (objId !== '*' && utils.isUndefinedOrNull(data.id)) {
                throw new this.RunFunctionException(errInvalid + 'configData.id', data);
            }
            if (utils.isUndefinedOrNull(data.functionName)) {
                throw new this.RunFunctionException(errInvalid + 'configData.functionName', data);
            }
            if (data.id === '*') {
                // change the ID in the data object so that it can be referenced by the callback functions later, if needed
                data.id = objId;
            }
            var msg;
            if (objId === '*' || data.id === objId) {
                var functionPointer = authorizedFunctions[data.functionName];
                if (utils.getVariableType(functionPointer) === 'Function') {
                    data.functionResult = utils.runFunction(functionPointer, data.args, data.thisContext);
                }
                else {
                    msg = errRequested + 'function has not been authorized: ' + data.functionName;
                    console.error(msg);
                    data.error = msg;
                }
            }
            else {
                msg = errRequested + 'ID (' + data.id + ') does not match internal ID';
                if (utils.debug) {
                    console.warn(msg);
                }
                data.error = msg;
            }
            if (utils.isUndefinedOrNull(data.error)) {
                if (!utils.isUndefinedOrNull(data.callbackSuccess) && _.isFunction(data.callbackSuccess)) {
                    data.callbackSuccessResult = data.callbackSuccess(data);
                }
            }
            else {
                if (!utils.isUndefinedOrNull(data.callbackFail) && _.isFunction(data.callbackFail)) {
                    data.callbackFailResult = data.callbackFail(data);
                }
            }
            return data;
        },

        /**
         * Toggle the debug flag, which is used to allow certain information messages to be written to the console.
         */
        toggleDebug: function() {
            utils.debug = !this.debug;
            console.log('Debug for psUtils now is: ' + this.debug);
        },

        /**
         * Rounds and limits a numeric value to a maximum number of decimal places.
         * @param value The value either as a Number, a String or an input element
         * @param decimals The maximum number of decimals to allow (defaults to 0)
         * @return A numeric value with decimals, if applicable
         */
        toFixed: function(value, decimals) {
            var result = '';
            if (utils.hasValue(value)) {
                var decType = utils.getVariableType(decimals);
                if (!utils.hasValue(decimals) || decType !== 'Number' || (decType === 'Number' && decimals < 0)) {
                    decimals = 0;
                }
                else if (decimals > 20) {
                    decimals = 20;
                }
                var valType = utils.getVariableType(value);
                switch (valType) {
                    case 'Element':
                        result = parseFloat(value.value);
                        break;
                    case 'Number':
                        result = value;
                        break;
                    case 'String':
                        result = parseFloat(value);
                        break;
                    default:
                        result = '';
                        break;
                }
                if (result === 'NaN' || _.isNaN(result) || !utils.hasValue(result)) {
                    result = '';
                }
                else {
                    result = parseFloat(result.toFixed(decimals));
                }
            }
            return result;
        },

        /**
         * Converts a numeric value (either as a Number or a String) into the equivolent Hex string.
         * @param value The value either as a Number, a String or an input element
         * @param upper A boolean flag to indicate if the results should be returned in upper-case
         * @return The numeric value converted into a Hex string
         */
        toHex: function(value, upper) {
            var result = '';
            if (utils.hasValue(value)) {
                var valType = utils.getVariableType(value);
                switch (valType) {
                    case 'Element':
                        result = utils.toHex(value.value);
                        break;
                    case 'Number':
                    case 'String':
                        result = parseInt(value).toString(16);
                        if (result < 0 || result === 'NaN' || _.isNaN(result)) {
                            result = '';
                        }
                        else if (result.length % 2 > 0) {
                            result = '0' + result;
                        }
                        break;
                    default:
                        result = '';
                        break;
                }
                if (utils.isTrue(upper)) {
                    result = result.toUpperCase();
                }
            }
            return result;
        },

        /**
         * Used when you need the relative path of a template and you don't know where you are.
         * Typically used inside the template of a directive that is being used on multiple pages.
         * This function will take your current position and back it up until it hits web_root, then
         * progress you forward using the path provided.
         * @param {*} url partial path of destination from web_root. (ie. 'scripts/components/feature/views/template.html')
         */
        getRelativePathFromWebroot: function(url) {
            // Start with a blank slate
            var relPath = '';
            // Get absolute URL to start
            var pathName = location.pathname;
            // Trim everything leading up to '/admin' including the leading slash
            var adminStart = pathName.indexOf('/admin');
            pathName = pathName.substring(adminStart + 1);
            // Split by path separator to find how far back to go in relative path
            var splitLength = pathName.split('/').length;
            // Add directory traversal syntax for each "directory" component of the url
            for (var i = 0; i < splitLength - 1; i++) {
                relPath = relPath + '../';
            }
            // Append the root path to the drawer template
            return relPath + url;
        }
    };
    utils.naturalCompareOptions.reset();
    return utils;
});
