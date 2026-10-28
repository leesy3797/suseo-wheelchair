import { spawnSync } from 'node:child_process';
import { createReadStream, createWriteStream } from 'node:fs';
import { copyFile, link, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { once } from 'node:events';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(projectRoot, 'srt_suseo_modeling', '3.모델링');
const materialRoot = path.join(sourceRoot, 'MATERIALS');
const sourceMaterialRoot = path.join(sourceRoot, 'mtl');
const outputRoot = path.join(projectRoot, 'public', 'models');
const temporaryRoot = await mkdtemp(path.join(projectRoot, '.station-model-build-'));
const obj2gltf = path.join(projectRoot, 'node_modules', 'obj2gltf', 'bin', 'obj2gltf.js');
const gltfTransform = path.join(projectRoot, 'node_modules', '@gltf-transform', 'cli', 'bin', 'cli.js');

const models = [
  { name: '01 지상건물.obj', material: '01 지상건물.mtl', output: 'station-1f.glb' },
  { name: '02 지하 1층 중앙홀.obj', material: '02 지하 1층 중앙홀.mtl', output: 'station-b1.glb' },
  { name: '03 지하 2층 대합실.obj', material: '03 지하 2층 대합실.mtl', output: 'station-b2-concourse.glb' },
  { name: '04 지하 2층 플렛폼.obj', material: '04 지하 2층 플렛폼.mtl', output: 'station-b2-platform.glb' },
];

function runNode(script, args) {
  const result = spawnSync(process.execPath, [script, ...args], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${path.basename(script)} failed with exit code ${result.status}`);
}

async function prepareModel(model, stagingRoot) {
  const modelRoot = path.join(stagingRoot, path.parse(model.name).name);
  const stagedMaterials = path.join(modelRoot, 'MATERIALS');
  await mkdir(stagedMaterials, { recursive: true });

  const materialSource = path.join(sourceMaterialRoot, model.material);
  const materialText = await readFile(materialSource, 'utf8');
  const textureNames = new Set();
  const rewrittenMaterial = materialText.replace(
    /^(map_\w+)\s+(.+)$/gim,
    (line, directive, filename) => {
      const textureName = filename.trim();
      textureNames.add(textureName);
      return `${directive} MATERIALS/${textureName}`;
    },
  );
  await writeFile(path.join(modelRoot, model.material), rewrittenMaterial, 'utf8');

  for (const textureName of textureNames) {
    const source = path.join(materialRoot, textureName);
    const destination = path.join(stagedMaterials, textureName);
    try {
      await link(source, destination);
    } catch (error) {
      if (error.code !== 'EXDEV' && error.code !== 'EPERM' && error.code !== 'EACCES') throw error;
      await copyFile(source, destination);
    }
  }

  const stagedObj = path.join(modelRoot, model.name);
  const sourceObj = path.join(sourceRoot, model.name);
  const output = createWriteStream(stagedObj, { encoding: 'utf8' });
  const lines = createInterface({
    input: createReadStream(sourceObj, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });
  for await (const line of lines) {
    const text = /^mtllib\s+/i.test(line) ? `mtllib ${model.material}\n` : `${line}\n`;
    if (!output.write(text)) await once(output, 'drain');
  }
  output.end();
  await once(output, 'finish');
  return { modelRoot, stagedObj };
}

try {
  await mkdir(outputRoot, { recursive: true });
  for (const model of models) {
    console.log(`\nPreparing ${model.name}`);
    const stagingRoot = path.join(temporaryRoot, path.parse(model.name).name);
    await mkdir(stagingRoot, { recursive: true });
    const { modelRoot, stagedObj } = await prepareModel(model, stagingRoot);
    const rawGlb = path.join(modelRoot, 'converted.glb');
    const optimizedGlb = path.join(outputRoot, model.output);

    runNode(obj2gltf, ['-i', stagedObj, '-o', rawGlb, '-b']);
    runNode(gltfTransform, [
      'optimize',
      rawGlb,
      optimizedGlb,
      '--simplify',
      'true',
      '--simplify-ratio',
      '0.4',
      '--simplify-error',
      '0.01',
      '--weld',
      'true',
      '--texture-size',
      '1024',
      '--texture-compress',
      'webp',
      '--compress',
      'meshopt',
    ]);
  }
  console.log(`\nOptimized models written to ${path.relative(projectRoot, outputRoot)}`);
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
