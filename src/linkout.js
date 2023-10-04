;(function () {
  class Plugin {
    name = "Linkout"
    version = '1.0'
    install() {}
    configure(pluginManager) {
      //https://stackoverflow.com/questions/29182244/convert-a-string-to-a-template-string
      function interpolate(template, variables, fallback) {
        const regex = /\${[^{]+}/g;
        return template.replace(regex, (match) => {
          const path = match.slice(2, -1).trim();
          return getObjPath(path, variables, fallback);
        });
      }

      //get the specified property or nested property of an object
      function getObjPath(path, obj, fallback = '') {
        return path.split('.').reduce((res, key) => res[key] || fallback, obj);
      }

      function decode_gff_specific_bits(s) {
        let out = decodeURI(s)
          .replace("%3B", ";")
          .replace("%2C", ",")
          .replace("%3D", "=")
          .replace("%26", "&")
        return out
      }

      function linkout_base(sep, dict, feature, attribute = "dbxref") {
        if (!feature) {
          return null
        }

        if (!feature[attribute]) {
          return null
        }

        attribute = attribute.toLowerCase()


        let dbxref = Array.isArray(feature[attribute]) ? feature[attribute] : [feature[attribute]];
        const splregex = new RegExp(`([^${sep}][^${sep}]*)${sep}?(.*)`)

        dbxref = dbxref.map(xr => {
          var [, db, dbid] = xr.match(splregex);
          if (dbid == '') {
            dbid = db
            db = ''
          }
          dbid = decode_gff_specific_bits(dbid)

          if ((db === null) || (db === '') || (link === undefined)) {
            db = "default"
          }

          let link = dict[db.replace(/\||\/|\-|#|\./g, '_')]
          if ((link === null) || (link === undefined) || (link === '')) {
            return xr
          }

          link = interpolate(
            link,
            {
              'xref': encodeURI(xr),
              'db': encodeURI(db),
              'id': encodeURI(dbid),
              'xref_colon': encodeURI(xr).replace(':', '%3A'),
              'db_colon': encodeURI(db).replace(':', '%3A'),
              'id_colon': encodeURI(dbid).replace(':', '%3A'),
              'xref_': xr,
              'db_': db,
              'id_': dbid
            },
            '#'
          )

          return `<a href='${link}' target='_blank'>${xr}</a>`
        })
        return dbxref

      }

      const DEFAULT_DBXREF = {
        InterPro: 'https://www.ebi.ac.uk/interpro/entry/InterPro/${id}',
        MetaCyc: 'https://metacyc.org/META/NEW-IMAGE?object=${id}',
        Reactome: 'https://reactome.org/content/detail/${id}',
        GO: 'https://amigo.geneontology.org/amigo/term/${xref}',
        SO: 'http://www.sequenceontology.org/browser/current_release/term/${xref}',
        'G3DSA': 'https://www.ebi.ac.uk/interpro/entry/cathgene3d/${xref}/',
        PFAM: 'https://www.ebi.ac.uk/interpro/entry/pfam/${id}/',
        Pfam: 'https://www.ebi.ac.uk/interpro/entry/pfam/${id}/',
        PANTHER: 'https://www.ebi.ac.uk/interpro/entry/panther/${id}/',
        CDD: 'https://www.ebi.ac.uk/interpro/entry/cdd/${id}/',
        HAMAP: 'https://www.ebi.ac.uk/interpro/entry/hamap/${id}/',
        NCBIfam: 'https://www.ebi.ac.uk/interpro/entry/ncbifam/${id}/',
        TIGRFAM: 'https://www.ncbi.nlm.nih.gov/genome/annotation_prok/evidence/${id}/',
        PIRSF: 'https://www.ebi.ac.uk/interpro/entry/pirsf/${id}/',
        PRINTS: 'https://www.ebi.ac.uk/interpro/entry/prints/${id}/',
        PROSITEprofiles: 'https://www.ebi.ac.uk/interpro/entry/profile/${id}/',
        PROSITE_PROFILES: 'https://www.ebi.ac.uk/interpro/entry/profile/${id}/',
        PROSITEpatterns: 'https://www.ebi.ac.uk/interpro/entry/prosite/${id}/',
        PROSITE_PATTERNS: 'https://www.ebi.ac.uk/interpro/entry/prosite/${id}/',
        PROSITE: 'https://www.ebi.ac.uk/interpro/entry/prosite/${id}/',
        SFLD: 'https://www.ebi.ac.uk/interpro/entry/sfld/${id}/',
        SMART: 'https://www.ebi.ac.uk/interpro/entry/smart/${id}/',
        SUPERFAMILY: 'https://www.ebi.ac.uk/interpro/entry/ssf/${id}/',
        Rfam: 'https://rfam.org/family/${id}',
        RFAM: 'https://rfam.org/family/${id}',
        Dfam: 'https://dfam.org/family/${id}/summary',
        DFAM: 'https://dfam.org/family/${id}/summary',
        AlphaFold: 'https://alphafold.ebi.ac.uk/entry/${id}',
        PDB: 'https://www.rcsb.org/structure/${id}',
        'UniProtKB_Swiss_Prot': 'https://www.uniprot.org/uniprotkb/${id}/entry',
        GenBankNuc: 'https://www.ncbi.nlm.nih.gov/nuccore/${id}',
        RefSeqNuc: 'https://www.ncbi.nlm.nih.gov/nuccore/${id}',
        GenBank: 'https://www.ncbi.nlm.nih.gov/protein/${id}',
        RefSeq: 'https://www.ncbi.nlm.nih.gov/protein/${id}',
        NCBI_GN: 'https://www.ncbi.nlm.nih.gov/nuccore/${id}',
        NCBI_GP: 'https://www.ncbi.nlm.nih.gov/protein/${id}',
        PUBMED: 'https://pubmed.ncbi.nlm.nih.gov/${id}/',
        DOI: 'https://doi.org/${id}',
        CCDS: 'https://www.ncbi.nlm.nih.gov/CCDS/CcdsBrowse.cgi?REQUEST=CCDS&DATA=${id}',
        MIM: 'https://omim.org/entry/${id}',
        HGNC: 'https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/${xref}',
        GeneID: 'https://www.ncbi.nlm.nih.gov/gene/${id}',
        ENSEMBL: 'https://www.ensembl.org/Multi/Search/Results?q=${id}',
        miRBase: 'https://mirbase.org/results/?query=${id}',
        OrthoDB: 'https://www.orthodb.org/?&query=${id}',
        taxid: 'https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=${id}',
        PHI: 'http://www.phi-base.org/searchFacet.htm?queryTerm=${xref_colon}',
        PHIG: 'https://poc.molecularconnections.com/phibase-v2/#/search-detail-page/${xref}',
        CHEBI: 'https://www.ebi.ac.uk/chebi/searchId.do?chebiId=${xref}'
      }

      const DEFAULT_ONTOLOGY = {
        GO: 'https://amigo.geneontology.org/amigo/term/${xref}',
        SO: 'http://www.sequenceontology.org/browser/current_release/term/${xref}',
        default: 'https://www.ebi.ac.uk/ols4/search?q=${xref}'
      }

      function linkout_dbxref(feature) {
        return linkout_base(':', DEFAULT_DBXREF, feature, "dbxref")
      }

      function linkout_ontology_term(feature) {
        return linkout_base(':', DEFAULT_ONTOLOGY, feature, "ontology_term")
      }

      function linkout_defaults(feature) {
        return {
          dbxref: linkout_dbxref(feature),
          ontology_term: linkout_ontology_term(feature)
        }
      }

      pluginManager.jexl.addFunction('linkout', linkout_base)
      pluginManager.jexl.addFunction('linkout_dbxref', linkout_dbxref)
      pluginManager.jexl.addFunction('linkout_ontology_term', linkout_ontology_term)
      pluginManager.jexl.addFunction('linkout_defaults', linkout_defaults)
    }
  }

  // the plugin will be included in both the main thread and web worker, so
  // install plugin to either window or self (webworker global scope)
  ;(typeof self !== 'undefined' ? self : window).JBrowsePluginLinkout = {
    default: Plugin,
  }
})()
