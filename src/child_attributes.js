;(function() {
  class Plugin {
    name = 'ChildAttributes'
    version = '1.0'
    install() {}
    configure(pluginManager) {

      function decode_gff_specific_bits(s) {
        let out = decodeURI(s)
          .replace("%3B", ";")
          .replace("%2C", ",")
          .replace("%3D", "=")
          .replace("%26", "&")
        return out
      }

      pluginManager.jexl.addFunction('childAttributes', (feature, sep, attribute, exclude = [], split = null)  => {
        if (feature === null) {
          return null
        }
        let sf = feature.subfeatures
        if ((sf === undefined) || (sf === null) || (Array.isArray(sf) && (sf.length <= 0) )) {
          return null
        }
        sf = (Array.isArray(sf) ? sf : [sf])

        let exclude_ = ((exclude === null) || (exclude === '') || (exclude === undefined)) ? [] : (Array.isArray(exclude) ? exclude : [exclude]) 
          .filter(ei => (ei !== null) && (ei !== undefined))
          .map(ei => ei.toLowerCase());

        let at = sf.map(sfi => sfi.get(attribute))

        if (split !== null) {
          at = at.flatMap(ai => ai.split(split))
        }

        at = at.filter(ai => ((ai !== null) && (ai !== '') && (ai !== undefined)));

        at = at.filter(ai => !exclude_.includes(ai.toLowerCase()))
          .filter(ai => (ai !== null) && (ai !== '') && (ai !== undefined));

        if (at.length === 0) {
          return null
        }

        at = at.map(ai => decode_gff_specific_bits(ai));

        at = [...new Set(at)]
        return at.join(sep)
      })
    }
  }
  ;(typeof self !== 'undefined' ? self : window).JBrowsePluginChildAttributes = {
    default: Plugin,
  }
})()
