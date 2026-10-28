import React, { Component, Suspense, useCallback, useEffect, useMemo } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { Line, OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

const MODEL_ROOT = ['srt_suseo_modeling', '3.모델링'];
const MODEL_SCALE = 0.1;
const MODEL_CENTER = { x: 161, z: -96 };
const FLOOR_HEIGHT = { '1F': 7.2, B1: 0, B2: -7.2 };
const MIN_CAMERA_DISTANCE = 2;

function assetUrl(...parts) {
  return `/${[...MODEL_ROOT, ...parts].map(encodeURIComponent).join('/')}`;
}

export const stationModels = [
  {
    id: 'ground',
    file: '01 지상건물.obj',
    material: '01 지상건물.mtl',
    floor: '1F',
    sourceFloor: 1.196,
    defaultVisible: true,
    label: '01 · 지상건물',
  },
  {
    id: 'b1',
    file: '02 지하 1층 중앙홀.obj',
    material: '02 지하 1층 중앙홀.mtl',
    floor: 'B1',
    sourceFloor: -3.085,
    defaultVisible: true,
    label: '02 · 지하 1층 중앙홀',
  },
  {
    id: 'b2-concourse',
    file: '03 지하 2층 대합실.obj',
    material: '03 지하 2층 대합실.mtl',
    floor: 'B2',
    sourceFloor: -11.32,
    defaultVisible: true,
    label: '03 · 지하 2층 대합실',
  },
  {
    id: 'b2-platform',
    file: '04 지하 2층 플렛폼.obj',
    material: '04 지하 2층 플렛폼.mtl',
    floor: 'B2',
    sourceFloor: -10.5,
    defaultVisible: true,
    label: '04 · 지하 2층 플랫폼',
  },
];

function ModelErrorBoundary({ children, model, onError }) {
  return (
    <ModelBoundaryInner model={model} onError={onError}>
      {children}
    </ModelBoundaryInner>
  );
}

class ModelBoundaryInner extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    this.props.onError(this.props.model.label, error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Text position={[0, FLOOR_HEIGHT[this.props.model.floor], 0]} fontSize={0.6} color="#ff9a91" anchorX="center">
          {this.props.model.label} 로딩 실패
        </Text>
      );
    }
    return this.props.children;
  }
}

function SourceModel({ model, onLoaded, onBounds }) {
  const materialUrl = assetUrl('mtl', model.material);
  const objectUrl = assetUrl(model.file);
  const texturePath = `${assetUrl('MATERIALS')}/`;
  const prepareMaterials = useCallback((loader) => {
    loader.setResourcePath(texturePath);
  }, [texturePath]);
  const materials = useLoader(MTLLoader, materialUrl, prepareMaterials);
  useMemo(() => materials.preload(), [materials]);
  const prepareObject = useCallback((loader) => {
    loader.setMaterials(materials);
  }, [materials]);
  const source = useLoader(OBJLoader, objectUrl, prepareObject);
  const object = useMemo(() => source.clone(true), [source]);
  const bounds = useMemo(() => new THREE.Box3().setFromObject(source), [source]);

  useEffect(() => {
    object.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = false;
      child.receiveShadow = false;
      child.frustumCulled = true;
    });
    onBounds(model.id, model.floor, bounds);
    onLoaded(model.id);
  }, [bounds, model.floor, model.id, object, onBounds, onLoaded]);

  const floorY = FLOOR_HEIGHT[model.floor];
  return (
    <group
      position={[
        -MODEL_CENTER.x * MODEL_SCALE,
        floorY - model.sourceFloor * MODEL_SCALE,
        -MODEL_CENTER.z * MODEL_SCALE,
      ]}
      scale={MODEL_SCALE}
    >
      <primitive object={object} dispose={null} />
    </group>
  );
}

function FloorGuide({ floor, y, color }) {
  return (
    <group position={[0, y, 0]}>
      <Line
        points={[
          [-36, 0, -23],
          [36, 0, -23],
          [36, 0, 23],
          [-36, 0, 23],
          [-36, 0, -23],
        ]}
        color={color}
        transparent
        opacity={0.45}
        lineWidth={1}
      />
      <Text position={[-34, 0.3, -21.5]} fontSize={1.05} color={color} anchorX="left" outlineWidth={0.06} outlineColor="#08121d">
        {floor}
      </Text>
    </group>
  );
}

function MapScene({ visibleModels, onLoaded, onBounds, onError, controlsRef, onZoom }) {
  const onModelLoaded = useCallback((id) => onLoaded(id), [onLoaded]);
  const onModelBounds = useCallback((id, floor, bounds) => onBounds(id, floor, bounds), [onBounds]);
  const onModelError = useCallback((label, message) => onError(label, message), [onError]);

  return (
    <>
      <color attach="background" args={['#08121d']} />
      <ambientLight intensity={0.75} />
      <hemisphereLight args={['#d9e8f3', '#45505a', 0.7]} />
      <directionalLight position={[30, 48, 28]} intensity={1.8} />
      <directionalLight position={[-24, 20, -35]} intensity={0.45} color="#7ab9cf" />
      <FloorGuide floor="1F" y={FLOOR_HEIGHT['1F'] - 0.5} color="#6ee6d7" />
      <FloorGuide floor="B1" y={FLOOR_HEIGHT.B1 - 0.5} color="#f0c77d" />
      <FloorGuide floor="B2" y={FLOOR_HEIGHT.B2 - 0.5} color="#bea8ff" />
      {stationModels.filter((model) => visibleModels[model.id]).map((model) => (
        <ModelErrorBoundary key={model.id} model={model} onError={onModelError}>
          <Suspense fallback={null}>
            <SourceModel model={model} onLoaded={onModelLoaded} onBounds={onModelBounds} />
          </Suspense>
        </ModelErrorBoundary>
      ))}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={[0, 0, 0]}
        maxPolarAngle={Math.PI * 0.49}
        minPolarAngle={Math.PI * 0.08}
        enablePan
        screenSpacePanning
        minDistance={MIN_CAMERA_DISTANCE}
        maxDistance={280}
        mouseButtons={{
          LEFT: THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE,
        }}
        onEnd={(event) => onZoom(event.target.getDistance())}
      />
    </>
  );
}

export default function MapTestScene(props) {
  return (
    <Canvas
      camera={{ position: [74, 98, 117], fov: 40, near: 0.1, far: 1500 }}
      dpr={[1, 1.1]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor('#08121d');
      }}
    >
      <MapScene {...props} />
    </Canvas>
  );
}
