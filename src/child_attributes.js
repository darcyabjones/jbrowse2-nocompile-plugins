;(function() {
  class Plugin {
    name = 'ChildAttributes'
    version = '1.0'
    install() {}
    configure(pluginManager) {
      pluginManager.jexl.addFunction('childAttributes', (feature, sep, attribute, exclude = [], split = null)  => {
        if (feature === null) {
          return null
        }
        let sf = feature.subfeatures
        if (sf === null || (Array.isArray(sf) && (sf.length <= 0) )) {
          return null
        }
        sf = (Array.isArray(sf) ? sf : [sf])

        let exclude_ = ((exclude === null) || (exclude === '')) ? [] : (Array.isArray(exclude) ? exclude : [exclude]) 
          .map(ei => ei.toLowerCase());

        let at = sf.map(sfi => sfi.get(attribute))

        if (split !== null) {
          at = at.flatMap(ai => ai.split(split))
        }

        at = at.filter(ai => !exclude_.includes(ai.toLowerCase()))
          .filter(ai => ((ai !== null) || (ai !== '')));

        at = [...new Set(at)]
        return at.join(sep)
      })
    }
  }
  ;(typeof self !== 'undefined' ? self : window).JBrowsePluginChildAttributes = {
    default: Plugin,
  }
})()
