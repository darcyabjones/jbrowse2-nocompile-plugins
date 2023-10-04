# jbrowse2-nocompile-plugins
Some helper functions for customising JBrowse2 servers

These are intended to be used to change displays inside of track configurations, as described in: [https://jbrowse.org/jb2/docs/config_guides/customizing_feature_details/](https://jbrowse.org/jb2/docs/config_guides/customizing_feature_details/).
I've generally found that developing these tools can be quite hard to understand because the documentation is a bit lacking sometimes, and there isn't much out there to draw from except from the offical developers.
I'll try to document things as I learn them for my sake and in-case it helps other.


The plugins are organised logically so that you can avoid needing to load everything at once.
Eventually i'll figure out an automatic minify-ing thing, but for now you'll need to suffer the extra KBs.


To include the plugins, download the js files locally and add the following sections from `"plugins"` to your `config.json` file as below.

```json
{
  "plugins": [
    {
      "name": "Linkout",
      "url": "linkout.js"
    },
    {
      "name": "ChildAttributes",
      "url": "child_attributes.js"
    }
  ],
  "assemblies": [],
  "tracks": []
}
```

See the [JBrowse2 documentation](https://jbrowse.org/jb2/docs/config_guides/plugins/) for more on configuring plugins.



## `linkout.js`

This creates hyperlinks for the database ids in your GFF3 `Dbxref` and `Ontology_term` attributes which you can view in the little side widget thing when you click on a gene.
We assume that the databases to link to can be accessed as described by the [NCBI dbxref guidelines](https://www.ncbi.nlm.nih.gov/genbank/collab/db_xref/), e.g. `database:database_id`.

This is a beefed up version of the example no-build plugin given in the [JBrowse2 documentation](https://jbrowse.org/jb2/docs/config_guides/customizing_feature_details/).
The difference is that their solution was limited to `dbxref` terms and it was difficult to extend without modifying the plugin.


Four functions are made available as JEXL callbacks.
`linkout` is the most complex, and the others really just provide convenient defaults.

```javascript
linkout(sep, dict, feature, attribute = 'Dbxref')

// sep -- is the character or string separating the database from the database id, typically this will be ':'
// dict -- an object mapping databases to a template string to link your database ids to.
// feature -- is the actual json object that JBrowse2 gives you.
// attribute -- is the GFF3 attribute that you want to find links from. Default is Dbxref, but could also be Ontology_term.
//     NOTE: JBrowse2 GFF3 attributes are actually all lowercased, so to access them you would use dbxref instead of Dbxref.
//     In this case we lowercase it for you just in case.
```

Because accessing info pages can sometimes be tricky, we use a simple string substitution to insert details where you need to.
These resemble [javascript template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals).
You can use the following variables in your template string (we'll use the fake accession 'DATABASE:​1234:567' as an example):

- `xref` is the actual whole dbxref entry (e.g. 'DATABASE:​1234:5678')
- `id` is the part after the sep character (e.g. '1234:5678')
- `db` is the part before the sep character (e.g. 'DATABASE')

So some quick examples would be:

```
https://www.example.com/${xref}/summary
// Becomes: https://www.example.com/DATABASE:1234:5678/summary

https://www.example2.com?query=${id}
// Becomes: https://www.example2.com?query=1234:5678
```

By default these are all URL escaped, so characters with special meanings will be URL encoded (e.g. `#` becomes `%23`).
You can use the unescaped versions by adding a trailing underscore to the variable (e.g. `xref_`, `id_`, `db_`).
There is also an option to additionally escape colons (`:` becomes `%3A`, in addition to usual url encoding), because some databases and google wanted encoded colons (`xref_colon`, `id_colon`, `db_colon`).


An example configuration in a GFF3 track:

```json
{
  "type": "FeatureTrack",
  "trackId": "InterProScan:5.62-94.0:PFAM:35.0",
  "name": "PFAM",
  "adapter": {
    // As in documentation
  },
  "assemblyNames": [
    "Example"
  ],
  "formatDetails": {
    "feature": "jexl: {dbxref: linkout(':', {Pfam: 'https://www.ebi.ac.uk/interpro/entry/pfam/${id}/'}, feature, 'dbxref')}",
    "subfeatures": "jexl: {ontology_term: linkout(':', {GO: 'https://amigo.geneontology.org/amigo/term/${xref}'}, feature, 'ontology_term')}",
  }
}
```

In this example, for the top-level features (e.g. the genes), the 'Feature details' panel will add links to any `Dbxref` elements with the pattern `Pfam:1234`. Everything else should be left alone.
For the lower level features (e.g. the mRNA, CDS etc), the 'Feature details' panel will add links to `Ontology_term` elements matching the pattern `GO:1234`.

There is also an option to add a default URL, which will catch anything that isn't listed as one of your databases.
E.g. you could just add a link to perform a google search:

```
{Pfam: 'https://www.ebi.ac.uk/interpro/entry/pfam/${id}/', default: https://www.google.com/search?q=${xref_colon}}
```

So entries with Pfam before the sep character will be linked to interpro, everything else will just send you to a google search results page.

> NOTE: The second argument `dict` (e.g. `{Pfam: "https://www.example.com"}`), is just a javascript object.
> Similarly, the thing after `jexl:` is a javascript object. It tells Jbrowse2 which fields we want to overwrite.
> You can't do something like `jexl: dbxref: linkout(...)` because it doesn't know what to do with `dbxref:`.
> For python people, it might be easier to think of it with quotes `jexl: {'dbxref': linkout(...)}`.

The three functions `linkout_dbxref`, `linkout_ontology_term`, and `linkout_defaults` are all convenience functions giving some defaults for a typical configuration and database links.
You can see the links in the source code.

They only need you to provide the feature that Jbrowse2 gives you (e.g `linkout_dbxref(feature)`).
`linkout_dbxref` and `linkout_ontology_term` operate on their respective GFF3 attributes an return arrays with URLs added.
`linkout_defaults` just performs both and returns an object with both.


```json
{
  "type": "FeatureTrack",
  "trackId": "InterProScan:5.62-94.0:PFAM:35.0",
  "name": "PFAM",
  "adapter": {
    // As in documentation
  },
  "assemblyNames": [
    "Example"
  ],
  "formatDetails": {
    "feature": "jexl: linkout_defaults(feature)",
    "subfeatures": "jexl: {'ontology_term': linkout_ontology_term(feature), 'dbxref': linkout_dbxref(feature)}",
  }
}
```

The jexl callbacks for feature and subfeatures are __exactly__ the same.


## `child_attributes.js`

This just gives you an easy way to fetch information from the children of a feature.
My intended use-case for this was to display `product` attributes in the genome browser description, where the `product` attribute was on the `mRNA` features but not the `gene`s themselves.
It will fetch an attribute from the kids, and return a string of all unique values joined by a selectable separator.

```javascript
childAttributes(feature, sep, dict, attribute, exclude = [], split = null)

// feature -- is the actual json object that JBrowse2 gives you.
// sep -- is a character or string to use to join multiple values fetched from the children.
//     e.g. you have multiple mRNAs with different products.
// attribute -- is the GFF3 field that you want to fetch from the children.
// exclude -- is an array of things to filter out of the results.
//     E.g. we wouldn't display `hypothetical protein` products.
// split -- Optional. Split the attributes before joining them again.
//     If you wanted to fetch all of the childrens dbxrefs you could use split=';'.
```

An example config would be this:

```json
{
  "type": "FeatureTrack",
  "trackId": "genes.gff3",
  "name": "mRNA",
  "adapter": {
    // As in documentation
  },
  "assemblyNames": [
    "Example"
  ],
  "displays": [
    {
      "type": "LinearBasicDisplay",
      "displayId": "ExampleUniqueDisplayID",
      "renderer": {
        "type": "SvgFeatureRenderer",
        "labels": {"description": "jexl:childAttributes(feature, ';', 'product', ['hypothetical protein'])"}
      }
    }
  ]
}
```


This will display any `product` from `mRNA` features as descriptions in the genome browser when you're zoomed in enough.
You could also modify the main gene name by replacing `description` with `name`.
