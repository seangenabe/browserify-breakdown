# browserify-breakdown

[![Greenkeeper badge](https://badges.greenkeeper.io/seangenabe/browserify-breakdown.svg)](https://greenkeeper.io/)

break down and analyze browserify/browser-pack bundles

## Usage

### CLI

```
browserify main.js > bundle.js
browserify-breakdown < bundle.js
```

Prints a breakdown of the [browser-pack] bundle with individual module size and total module size. If the bundle is being created using [browserify], the flag `--full-paths` / option `fullPaths` may be specified to include module paths in the output instead of integer IDs.

### API

```var breakdown = require('browserify-breakdown')```

**breakdown(bundleSrc)**

Returns a breakdown of the `browser-pack` bundle. The returned result is the result of walking through the dependency graph of the bundle with circular dependencies broken.

Each node in the returned result has the following properties:
* `id`: The module id.
* `size`: The module size, in UTF-8 bytes
* `totalSize`: The totalled size of the module and its dependencies, excluding circular and repeated dependencies.
* `deps`: An array of the module's dependencies.

The top-level node is a dummy node representing the whole bundle with `id=0` and `size=0`.

**breakdown.core(bundleSrc)**

The core breakdown function. Useful if you want more information about the nodes in the graph.

Returns an object with the properties:
* `info`: Raw information about a module in [module-deps] format.
* `graph`: An adjacency matrix of the initial dependency graph, a directed graph. Entry modules are dependencies of the dummy node `entry:`. Nodes are simply module IDs.
* `result`: Same as the output of the `breakdown` function. The dummy node `entry:` is stripped.
* `isolatedNodes`: An array with all the isolated modules. Normally, all modules should be a descendant of an entry module or an entry module itself, so this should be empty if that's the case.

## Rationale

I created this module as a lower-level alternative to [disc], which for some reason always breaks whenever I try to use it. I cannot find any other analyzer for [browserify], too. So I intend this to be something a bit better than `disc`.
* Plain CLI output via [archy] (the same thing used by `npm ls`)
* What-you-passed-it-is-what-you-get. If you passed `browserify --full-paths` input, that's fine. If your module IDs are integers, that's fine too... you'll see the integers being used as module IDs. 😜
* Low-level. Can be easily included into a bigger project that can e.g. provide the same visualization `disc` does, and possibly more.
* Hopefully better maintained, or at least maintained as well as the lower-level browserify modules ([module-deps], [browser-pack], [browser-unpack]).

[browser-pack]: https://www.npmjs.com/package/browser-pack
[browser-unpack]: https://www.npmjs.com/package/browser-unpack
[module-deps]: https://www.npmjs.com/package/module-deps
[disc]: https://www.npmjs.com/package/disc
[browserify]: https://www.npmjs.com/package/browserify
[archy]: https://www.npmjs.com/package/archy
