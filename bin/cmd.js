#!/usr/bin/env node

var breakdown = require('../')
var concat = require('concat-stream')
var FS = require('fs')
var archy = require('archy')
var prettyBytes = require('pretty-bytes')
var chalk = require('chalk')

process.stdin.pipe(concat(function(body) {
  var result = breakdown(body)

  function prepareForArchyInput(node) {
    var label = []
    if (node.circular) {
      label.push(chalk.yellow('CIRCULAR'))
      label.push(' ')
    }
    if (node.id === '') {
      label.push('bundle')
    }
    else {
      label.push(node.id)
    }
    label.push(' (')
    let isNonRoot = node.id !== ''
    if (isNonRoot) {
      label.push(prettyBytes(node.size))
    }
    if (node.size !== node.totalSize) {
      if (isNonRoot) {
        label.push('; ')
      }
      label.push('total ')
      label.push(prettyBytes(node.totalSize))
    }
    label.push(')')
    label = label.join('')

    var nodes = node.deps.map(function(node) {
      return prepareForArchyInput(node)
    })

    return { label: label, nodes: nodes }
  }

  var archyInput = prepareForArchyInput(result)

  var out = archy(archyInput)

  console.log(out)
}))
