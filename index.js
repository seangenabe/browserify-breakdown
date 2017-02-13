'use strict'

var unpack = require('browser-unpack')

function breakdownCore(bundleSrc) {
  var deps = unpack(bundleSrc)

  // Build dependency graph
  var info = {} // node info
  var graph = {} // directed graph where each node is a module
  var nodes = {} // list of all modules we can work on
  deps.forEach(function(row) {
    // Store a reference to the package.
    info[row.id] = row
    // Build graph
    Object.keys(row.deps).forEach(function(key) {
      var depId = row.deps[key]
      addGraphEdge(graph, row.id, depId)
    })
    // Entry points
    if (row.entry) {
      addGraphEdge(graph, 'entry:', row.id)
    }
    nodes[row.id] = true
  })

  // dummy info for `entry:` node
  info['entry:'] = { id: 'entry:', source: '' }

  // Walk through the dependency graph, ignoring circular references,
  // and return a flat array
  var walk = function walk(moduleId, path) {
    // Defaults
    path = Object.assign({}, path || {})

    // Mark node as visited
    delete nodes[moduleId]
    // Detect circular dep
    if (path[moduleId]) {
      return [
        {
          id: moduleId,
          circular: true,
          level: level,
          // having a circular dep won't add anything to the total byte size
          size: 0
        }
      ]
    }
    path[moduleId] = true

    // Current module info
    var currentModuleInfo = {
      id: moduleId,
      size: Buffer.byteLength(info[moduleId].source),
      deps: []
    }

    // Find the module's dependencies
    var depKeys = Object.keys(graph[moduleId] || {})

    var nodeDeps = depKeys.map(function(dep) {
      return walk(dep, Object.assign({}, path))
    })
    currentModuleInfo.deps = nodeDeps

    return currentModuleInfo
  }

  // Walk entry nodes
  var allEntry = walk('entry:')

  // Walk isolated nodes, if any remain
  var isolatedNodeKeys = Object.keys(nodes)
  var allIsolated = isolatedNodeKeys.map(function(moduleId) {
    return walk(moduleId, {}, 1)
  })

  var graphObject = {
    id: '',
    size: 0,
    deps: allEntry.deps.concat(allIsolated),
    isolatedNodes: isolatedNodeKeys
  }

  // Invoke assign total size to every node.
  function visitTotalSize(node) {
    node.totalSize = totalSize(node)
    node.deps.forEach(function(node) {
      visitTotalSize(node)
    })
  }

  // Get the total size of the node. This excludes repeated modules.
  function totalSize(node, visited) {
    visited = visited || {}
    if (visited[node.id]) {
      return 0
    }
    else {
      visited[node.id] = true
    }
    return node.size +
      sum(node.deps.map(function(dep) { return totalSize(dep, visited) }))
  }

  visitTotalSize(graphObject)

  return {
    result: graphObject,
    info: info,
    graph: graph
  }
}

function flatten(arr) {
  return arr.reduce(function(a, b) { return a.concat(b) }, [])
}

function sum(arr) {
  return arr.reduce(function(a, b) { return a + b }, 0)
}

function addGraphEdge(graph, node1, node2) {
  graph[node1] = graph[node1] || {}
  graph[node1][node2] = true
}

module.exports = function breakdown(bundleSrc) {
  return breakdownCore(bundleSrc).result
}

module.exports.core = breakdownCore
