import test from 'ava'
import breakdown from '..'
import getStream from 'get-stream'
import _FS from 'fs'
import pify from 'pify'
import pMap from 'p-map'
import Path from 'path'
import browserify from 'browserify'

const FS = pify(_FS)

test('breakdown', async t => {
  let fdir = `${__dirname}/fixture1`
  let stream = browserify(`${fdir}/index.js`, { fullPaths: true }).bundle()
  let bundleSrc = await getStream(stream)
  let result = breakdown(bundleSrc)

  let [az, bz, cz, iz] = await pMap(
    [
      FS.readFile(`${fdir}/a.js`),
      FS.readFile(`${fdir}/b.js`),
      FS.readFile(`${fdir}/c.js`),
      FS.readFile(`${fdir}/index.js`)
    ],
    buffer => buffer.length
  )

  /*
  bundle
  - index
    - a
    - b
      - c
  */
  const node_bundle = result.deps[0]
  const node_a = node_bundle.deps[0]
  const node_b = node_bundle.deps[1]
  const node_c = node_b.deps[0]

  t.is(node_c.size, cz)
  t.is(node_b.size, bz)
  t.is(node_b.totalSize, bz + cz)
  t.is(node_a.size, az)
  t.is(node_bundle.size, iz)
  t.is(node_bundle.totalSize, iz + az + bz + cz)
})

test('circular dep', async t => {
  let fdir = `${__dirname}/fixture2`
  let stream = browserify(`${fdir}/index.js`, { fullPaths: true }).bundle()
  let bundleSrc = await getStream(stream)
  let result = breakdown(bundleSrc)

  /*
  bundle
    - index
      - a
        - b
          - a (CIRCULAR)
  */

  const node_bundle = result.deps[0]
  const node_a = node_bundle.deps[0]
  const node_b = node_a.deps[0]
  const node_a_circular = node_b.deps[0]

  t.is(node_a_circular.size, 0)
  t.falsy(node_a_circular.deps)
  t.true(node_a_circular.circular)
})
