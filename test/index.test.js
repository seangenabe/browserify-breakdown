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

  t.is(result.deps[0].deps[1].deps[0].size, cz)
  t.is(result.deps[0].deps[1].size, bz)
  t.is(result.deps[0].deps[1].totalSize, bz + cz)
  t.is(result.deps[0].deps[0].size, az)
  t.is(result.deps[0].size, iz)
  t.is(result.deps[0].totalSize, iz + az + bz + cz)
})
