import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Line, OrbitControls, Text, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { BOUNDS, geofences, nodes } from '../simulation.js';

function floorHeight(floor) {
  return ({ '1F': 12, B1: 0, B2: -12 })[floor] ?? 0;
}

const architecture = [
  {
    file: '/models/station-1f.glb',
    floor: '1F',
    scale: 0.12,
    sourceCenter: [111.1236, -73.2111],
    targetCenter: [0, 0],
    sourceFloor: 1.196,
  },
  {
    file: '/models/station-b1.glb',
    floor: 'B1',
    scale: 0.08,
    sourceCenter: [128.9716, -72.4975],
    targetCenter: [0, 0.5],
    sourceFloor: -3.085,
  },
  {
    file: '/models/station-b2-concourse.glb',
    floor: 'B2',
    scale: 0.09,
    sourceCenter: [38.8114, -47.9208],
    targetCenter: [-6.7, 0.8],
    sourceFloor: -11.32,
  },
  {
    file: '/models/station-b2-platform.glb',
    floor: 'B2',
    scale: 0.04,
    sourceCenter: [281.2421, -61.5445],
    targetCenter: [1.8, -1.7],
    sourceFloor: -10.5,
  },
];

function configureGltfLoader(loader) {
  loader.setMeshoptDecoder(MeshoptDecoder);
}

function Floor({ level, selectable, onSelectPoint }) {
  const y = floorHeight(level);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y - 0.18, 0]} receiveShadow>
        <planeGeometry args={[BOUNDS.maxX - BOUNDS.minX, BOUNDS.maxZ - BOUNDS.minZ]} />
        <meshStandardMaterial color={level === 'B2' ? '#151b2a' : '#101e30'} roughness={0.92} />
      </mesh>
      {selectable && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, y - 0.08, 0]}
          onClick={onSelectPoint}
        >
          <planeGeometry args={[BOUNDS.maxX - BOUNDS.minX, BOUNDS.maxZ - BOUNDS.minZ]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

function StationArchitecture({ model }) {
  const { scene } = useGLTF(model.file, true, true, configureGltfLoader);
  const position = [
    model.targetCenter[0] - model.sourceCenter[0] * model.scale,
    floorHeight(model.floor) - model.sourceFloor * model.scale,
    model.targetCenter[1] - model.sourceCenter[1] * model.scale,
  ];
  return <primitive object={scene} position={position} scale={model.scale} dispose={null} />;
}

function Zone({ node, onClick, selectedDestination }) {
  const forbidden = node.forbidden;
  const color = selectedDestination ? '#7dffe7' : forbidden ? '#ff8a6a' : '#26e4d0';
  const radius = node.radius || 0.72;
  return (
    <group
      position={[node.x, floorHeight(node.floor), node.z]}
      onClick={onClick ? (event) => {
        event.stopPropagation();
        onClick(event);
      } : undefined}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
        <circleGeometry args={[radius, 40]} />
        <meshBasicMaterial color={color} transparent opacity={selectedDestination ? 0.25 : 0.12} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[radius - 0.08, radius - 0.035, 40]} />
        <meshBasicMaterial color={color} transparent opacity={selectedDestination ? 1 : 0.75} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <ringGeometry args={[radius + 0.08, radius + 0.11, 40]} />
        <meshBasicMaterial color={color} transparent opacity={selectedDestination ? 0.85 : 0.42} />
      </mesh>
      <mesh position={[0, 0.055, 0]}>
        <cylinderGeometry args={[0.025, 0.035, 0.11, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
      <Text position={[0, 0.12, radius + 0.2]} fontSize={0.2} color={forbidden ? '#ffb199' : '#8daac5'} anchorX="center">
        {node.label}
      </Text>
      {onClick && (
        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[radius + 0.2, radius + 0.2, 1.4, 20]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

function LidarSweep({ robot }) {
  const count = 24;
  const ranges = [0.55, 0.95, 1.35];
  const color = robot.nearestDist < 1.1 ? '#ffb56a' : robot.color;
  const arcs = useMemo(() => ranges.map((radius) =>
    Array.from({ length: count + 1 }, (_, index) => {
      const angle = -Math.PI / 2 + (Math.PI * index) / count;
      return [Math.sin(angle) * radius, 0.04, -Math.cos(angle) * radius];
    }),
  ), []);

  return (
    <group position={[0, 0.3, 0]}>
      <mesh position={[0, 0, -0.16]}>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {arcs.map((points, index) => (
        <Line
          key={ranges[index]}
          points={points}
          color={color}
          transparent
          opacity={robot.nearestDist < 1.1 ? 0.95 : 0.62 - index * 0.12}
          lineWidth={index === 0 ? 2 : 1.5}
        />
      ))}
    </group>
  );
}

function Robot({ robot, selected, onSelect, showLidar }) {
  const floor = robot.elevator
    ? floorHeight(robot.elevator.fromFloor)
      + (floorHeight(robot.elevator.toFloor) - floorHeight(robot.elevator.fromFloor))
      * Math.min(1, robot.elevator.elapsed / robot.elevator.duration)
    : floorHeight(robot.floor);
  return (
    <group
      position={[robot.x, floor + 0.12, robot.z]}
      rotation={[0, robot.heading || 0, 0]}
      onClick={(e) => {
        if (!onSelect) return;
        e.stopPropagation();
        onSelect(robot.id);
      }}
    >
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.34, 0.38, 0.18, 24]} />
        <meshStandardMaterial color={robot.color} emissive={robot.color} emissiveIntensity={selected ? 1.3 : robot.avoiding ? 0.9 : 0.45} />
      </mesh>
      <mesh position={[0, 0.39, 0]} castShadow>
        <boxGeometry args={[0.48, 0.42, 0.42]} />
        <meshStandardMaterial color="#d8e7f2" metalness={0.45} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.62, -0.06]}>
        <boxGeometry args={[0.28, 0.06, 0.24]} />
        <meshStandardMaterial color="#162b40" />
      </mesh>
      {[-0.23, 0.23].map((x) =>
        [-0.22, 0.22].map((z) => (
          <mesh key={`${x}:${z}`} position={[x, 0.06, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.07, 16]} />
            <meshStandardMaterial color="#070d14" />
          </mesh>
        )),
      )}
      <mesh position={[0, 0.015, 0]}>
        <ringGeometry args={[selected ? 0.65 : 0.48, selected ? 0.69 : 0.52, 40]} />
        <meshBasicMaterial color={robot.avoiding ? '#ffc46d' : robot.color} transparent opacity={0.95} />
      </mesh>
      {showLidar && <LidarSweep robot={robot} />}
      <Text position={[0, 1.02, 0]} fontSize={0.22} color={robot.color} anchorX="center" outlineWidth={0.025} outlineColor="#07111e">
        {robot.id}
      </Text>
      {selected && (
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.78, 0.82, 40]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      )}
    </group>
  );
}

function Person({ person }) {
  const moving = Math.hypot(person.vx || 0, person.vz || 0) > 0.05;
  return (
    <group position={[person.x, floorHeight(person.floor || '1F') + 0.08, person.z]}>
      {moving && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
          <circleGeometry args={[0.22, 12]} />
          <meshBasicMaterial color="#d4aa72" transparent opacity={0.22} />
        </mesh>
      )}
      <mesh position={[0, 0.26, 0]}>
        <capsuleGeometry args={[0.09, 0.28, 4, 8]} />
        <meshStandardMaterial color={person.hue ? '#d8b59a' : '#89a8cb'} />
      </mesh>
      <mesh position={[0, 0.49, 0]}>
        <sphereGeometry args={[0.085, 12, 12]} />
        <meshStandardMaterial color="#e7c7a9" />
      </mesh>
    </group>
  );
}

function RouteLine({ robot, floor, route = robot.route, color = robot.color, dashed = false }) {
  const points = useMemo(() => {
    const pts = (route || [])
      .map((id) => nodes.find((n) => n.id === id))
      .filter((node) => node && node.floor === floor)
      .map((n) => new THREE.Vector3(n.x, floorHeight(floor) + 0.08, n.z));
    return pts.length < 2 ? null : pts;
  }, [route, floor]);
  if (!points) return null;
  return <Line points={points} color={color} transparent opacity={0.9} lineWidth={2} dashed={dashed} dashSize={0.35} gapSize={0.2} />;
}

function Scene({
  robots, pedestrians, extras, selected, onSelect, missionDraft,
  onMapPoint, plannedPath, layers, selectionFloor,
}) {
  const active = robots.find((robot) => robot.id === selected);
  const levels = ['1F', 'B1', 'B2'];
  const drawPath = (path, floor, color, dashed = false) => {
    const points = (path || [])
      .filter((point) => point.floor === floor)
      .map((point) => new THREE.Vector3(point.x, floorHeight(floor) + 0.12, point.z));
    if (points.length < 2) return null;
    return <Line points={points} color={color} transparent opacity={0.96} lineWidth={2.5} dashed={dashed} dashSize={0.38} gapSize={0.22} />;
  };
  const selectFloorPoint = (event) => {
    if (!missionDraft?.selecting || !onMapPoint) return;
    event.stopPropagation();
    const floor = selectionFloor || '1F';
    onMapPoint({ x: event.point.x, z: event.point.z, floor });
  };
  return (
    <>
      <color attach="background" args={['#07111e']} />
      <fog attach="fog" args={['#07111e', 48, 82]} />
      <ambientLight intensity={1.5} />
      <directionalLight position={[8, 14, 6]} intensity={2.2} castShadow />
      <pointLight position={[-5, 5, -3]} color="#1ddfc8" intensity={30} distance={15} />
      {architecture.map((model) => (
        <Suspense key={model.file} fallback={null}>
          <StationArchitecture model={model} />
        </Suspense>
      ))}
      {levels.map((level) => {
        const floorY = floorHeight(level);
        const startPoint = missionDraft?.start || active?.originPoint;
        const destinationPoint = missionDraft?.destination || active?.targetPoint;
        const visibleDraftPath = missionDraft?.destination ? plannedPath : [];
        return (
          <group key={level}>
            <Floor
              level={level}
              selectable={missionDraft?.selecting && selectionFloor === level}
              onSelectPoint={selectFloorPoint}
            />
            <Text position={[0, floorY + 1.2, -6.5]} fontSize={0.38} color={level === '1F' ? '#8ff9e7' : level === 'B1' ? '#ffcc82' : '#b4a1ff'} anchorX="center" outlineWidth={0.04} outlineColor="#07111e">
              {level === '1F' ? '1F · STATION CONCOURSE' : `${level} · ${level === 'B1' ? 'CENTRAL HALL' : 'CONCOURSE + PLATFORMS'}`}
            </Text>
            {nodes.filter((node) => node.floor === level).map((node) => (
              <Zone
                key={node.id}
                node={node}
                selectedDestination={destinationPoint?.floor === level
                  && Math.hypot(destinationPoint.x - node.x, destinationPoint.z - node.z) <= (node.radius || 0.7)}
              />
            ))}
            {layers.geofence && geofences.filter((fence) => (fence.floor || '1F') === level).map((fence) => (
              <group key={fence.id} position={[fence.x, floorY, fence.z]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
                  <circleGeometry args={[fence.r, 28]} />
                  <meshBasicMaterial color="#ff6f4a" transparent opacity={0.16} />
                </mesh>
                <Text position={[0, 0.55, 0]} fontSize={0.2} color="#ffb199" anchorX="center">{fence.label}</Text>
              </group>
            ))}
            {(extras || []).filter((extra) => (extra.floor || '1F') === level).map((extra) => (
              <mesh key={extra.id} position={[extra.x, floorY + 0.22, extra.z]} castShadow>
                {extra.kind === 'cone' ? <coneGeometry args={[extra.r, 0.44, 12]} /> : <boxGeometry args={[extra.r * 1.5, 0.32, extra.r * 1.1]} />}
                <meshStandardMaterial color={extra.kind === 'cone' ? '#ff8a3d' : '#c4a574'} />
              </mesh>
            ))}
            {layers.crowd && pedestrians.filter((person) => (person.floor || '1F') === level).map((person) => <Person key={person.id} person={person} />)}
            {layers.path && robots.filter((robot) => robot.floor === level && !robot.missionPath && robot.route?.length > 1).map((robot) => (
              <RouteLine key={`path${robot.id}`} robot={robot} floor={level} />
            ))}
            {layers.path && missionDraft?.destination && drawPath(visibleDraftPath, level, '#45e0cf')}
            {!missionDraft && active?.plannedMissionPath?.length > 1
              && drawPath(active.plannedMissionPath, level, '#45e0cf')}
            {!missionDraft && active?.missionPath?.length > 1
              && drawPath(active.missionPath.slice(active.missionPathIndex || 0), level, '#ffbd69', true)}
            {[['START', startPoint, '#44e0cf'], ['DESTINATION', destinationPoint, '#ffc46d']].map(([label, point, color]) => (
              point?.floor === level && (
                <group key={label} position={[point.x, floorY + 0.06, point.z]}>
                  <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.48, 0.58, 40]} />
                    <meshBasicMaterial color={color} />
                  </mesh>
                  <Text position={[0, 0.48, 0]} fontSize={0.23} color={color} anchorX="center" outlineWidth={0.03} outlineColor="#07111e">{label}</Text>
                </group>
              )
            ))}
          </group>
        );
      })}
      {robots.map((robot) => (
        <Robot
          key={robot.id}
          robot={robot}
          selected={selected === robot.id}
          onSelect={missionDraft?.selecting ? undefined : onSelect}
          showLidar={layers.lidar}
        />
      ))}
      <OrbitControls
        makeDefault
        target={[0, 0, 0]}
        minDistance={5}
        maxDistance={160}
        maxPolarAngle={1.48}
        minPolarAngle={0.45}
        enablePan
        screenSpacePanning
        mouseButtons={{
          LEFT: THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE,
        }}
      />
    </>
  );
}

export default function StationScene(props) {
  return (
    <Canvas
      camera={{ position: [0, 28, 44], fov: 44 }}
      dpr={[1, 1.25]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
