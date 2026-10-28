import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Line, OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { buildings, geofences, nodes, pillars } from '../simulation.js';

function floorHeight(floor) {
  return floor === 'B1' ? -1.6 : 1.6;
}

function floorOffsetZ(floor) {
  return floor === 'B1' ? -9 : 9;
}

function Floor({ level }) {
  const y = floorHeight(level);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y - 0.18, 0]} receiveShadow>
        <planeGeometry args={[25, 15]} />
        <meshStandardMaterial color={level === 'B1' ? '#111b2b' : '#101e30'} roughness={0.92} />
      </mesh>
      {Array.from({ length: 26 }, (_, i) => (
        <mesh key={`gx${i}`} position={[-12.5 + i, y - 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.012, 15]} />
          <meshBasicMaterial color="#28405a" transparent opacity={0.55} />
        </mesh>
      ))}
      {Array.from({ length: 16 }, (_, i) => (
        <mesh key={`gz${i}`} position={[0, y - 0.155, -7.5 + i]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[25, 0.012]} />
          <meshBasicMaterial color="#28405a" transparent opacity={0.55} />
        </mesh>
      ))}
    </group>
  );
}

function Building({ x, z, w, d, label, color = '#1c3854', floor = '1F' }) {
  const h = 0.55;
  return (
    <group position={[x, floorHeight(floor), z]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
      <mesh position={[0, h + 0.025, 0]}>
        <boxGeometry args={[w + 0.08, 0.05, d + 0.08]} />
        <meshStandardMaterial color="#3c7098" emissive="#102b47" emissiveIntensity={0.5} />
      </mesh>
      <Text position={[0, h + 0.3, 0]} fontSize={0.24} color="#d8e8f8" anchorX="center" outlineWidth={0.015} outlineColor="#08111c">
        {label}
      </Text>
    </group>
  );
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
  const offsetZ = robot.elevator
    ? floorOffsetZ(robot.elevator.fromFloor)
      + (floorOffsetZ(robot.elevator.toFloor) - floorOffsetZ(robot.elevator.fromFloor))
      * Math.min(1, robot.elevator.elapsed / robot.elevator.duration)
    : floorOffsetZ(robot.floor);
  return (
    <group
      position={[robot.x, floor + 0.12, robot.z + offsetZ]}
      rotation={[0, robot.heading || 0, 0]}
      onClick={(e) => {
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

function Escalator({ floor = '1F' }) {
  return (
    <group position={[4, floorHeight(floor) + 0.02, 2]} rotation={[0, -0.45, 0]}>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[i * 0.16, i * 0.055, 0]}>
          <boxGeometry args={[0.22, 0.06, 0.8]} />
          <meshStandardMaterial color="#6a8198" />
        </mesh>
      ))}
      <mesh position={[0.55, 0.25, -0.46]}>
        <boxGeometry args={[1.5, 0.04, 0.04]} />
        <meshStandardMaterial color="#19d9c4" emissive="#19d9c4" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

function UndergroundTracks() {
  const railLines = [-4, 4].flatMap((centerX) => [centerX - 0.27, centerX + 0.27].map((x) => x));
  return (
    <group position={[0, floorHeight('B1'), 0]}>
      {[-8, 8].map((x) => (
        <group key={`platform-${x}`}>
          <mesh position={[x, 0.08, 0]}>
            <boxGeometry args={[2.8, 0.16, 13]} />
            <meshStandardMaterial color="#19384b" emissive="#0a222d" emissiveIntensity={0.45} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.18, 3.8]}>
            <ringGeometry args={[0.78, 0.84, 40]} />
            <meshBasicMaterial color="#2ae3d0" transparent opacity={0.72} />
          </mesh>
        </group>
      ))}
      {[-4, 4].map((centerX) => (
        <mesh key={`track-bed-${centerX}`} position={[centerX, 0.025, 0]}>
          <boxGeometry args={[1.3, 0.08, 13]} />
          <meshStandardMaterial color="#172331" />
        </mesh>
      ))}
      {railLines.map((x) => (
        <mesh key={`rail-${x}`} position={[x, 0.11, 0]}>
          <boxGeometry args={[0.065, 0.08, 13]} />
          <meshStandardMaterial color="#a9c2d0" metalness={0.7} roughness={0.25} />
        </mesh>
      ))}
      {Array.from({ length: 20 }, (_, i) =>
        [-4, 4].map((centerX) => (
          <mesh key={`sleeper-${centerX}-${i}`} position={[centerX, 0.09, -6.1 + i * 0.64]}>
            <boxGeometry args={[1.15, 0.07, 0.1]} />
            <meshStandardMaterial color="#546879" />
          </mesh>
        )),
      )}
      {[-4, 4].map((x, i) => (
        <Text key={`track-label-${x}`} position={[x, 0.28, -5.8]} fontSize={0.2} color="#ffca82" anchorX="center">
          TRACK {i + 1}
        </Text>
      ))}
    </group>
  );
}

function ElevatorShaft({ floor }) {
  const y = floorHeight(floor);
  return (
    <group position={[3, y, -3]}>
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[1.5, 1.7, 1.5]} />
        <meshBasicMaterial color="#32e4d1" transparent opacity={0.07} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[1.55, 1.75, 1.55]} />
        <meshBasicMaterial color="#44efdc" wireframe transparent opacity={0.45} />
      </mesh>
      <Text position={[0, 1.9, 0]} fontSize={0.18} color="#a3fff1" anchorX="center">
        ELEVATOR · 1F ↕ B1
      </Text>
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
  onMapPoint, plannedPath, layers,
}) {
  const active = robots.find((robot) => robot.id === selected);
  const levels = ['1F', 'B1'];
  const drawPath = (path, floor, color, dashed = false) => {
    const points = (path || [])
      .filter((point) => point.floor === floor)
      .map((point) => new THREE.Vector3(point.x, floorHeight(floor) + 0.12, point.z));
    if (points.length < 2) return null;
    return <Line points={points} color={color} transparent opacity={0.96} lineWidth={2.5} dashed={dashed} dashSize={0.38} gapSize={0.22} />;
  };
  const selectFloorPoint = (event, floor) => {
    if (!missionDraft || !onMapPoint) return;
    event.stopPropagation();
    const point = event.point;
    onMapPoint({ x: point.x, z: point.z - floorOffsetZ(floor), floor });
  };
  return (
    <>
      <color attach="background" args={['#07111e']} />
      <fog attach="fog" args={['#07111e', 48, 82]} />
      <ambientLight intensity={1.5} />
      <directionalLight position={[8, 14, 6]} intensity={2.2} castShadow />
      <pointLight position={[-5, 5, -3]} color="#1ddfc8" intensity={30} distance={15} />
      {levels.map((level) => {
        const floorY = floorHeight(level);
        const startPoint = missionDraft?.start || active?.originPoint;
        const destinationPoint = missionDraft?.destination || active?.targetPoint;
        const visibleDraftPath = missionDraft?.destination ? plannedPath : [];
        return (
          <group
            key={level}
            position={[0, 0, floorOffsetZ(level)]}
            onClick={(event) => selectFloorPoint(event, level)}
          >
            <Floor level={level} />
            <Text position={[0, floorY + 1.2, -6.5]} fontSize={0.38} color={level === '1F' ? '#8ff9e7' : '#ffcc82'} anchorX="center" outlineWidth={0.04} outlineColor="#07111e">
              {level === '1F' ? '1F · CONCOURSE' : 'B1 · TRAIN PLATFORMS'}
            </Text>
            {buildings.filter((building) => (building.floor || '1F') === level).map((building) => (
              <Building key={building.id} {...building} />
            ))}
            {nodes.filter((node) => node.floor === level).map((node) => (
              <Zone
                key={node.id}
                node={node}
                onClick={missionDraft ? (event) => selectFloorPoint(event, level) : undefined}
                selectedDestination={destinationPoint?.floor === level
                  && Math.hypot(destinationPoint.x - node.x, destinationPoint.z - node.z) <= (node.radius || 0.7)}
              />
            ))}
            {pillars.filter((pillar) => (pillar.floor || '1F') === level).map((pillar) => (
              <mesh key={pillar.id} position={[pillar.x, floorY + 0.45, pillar.z]} castShadow>
                <cylinderGeometry args={[pillar.r, pillar.r, 0.9, 16]} />
                <meshStandardMaterial color="#4a6278" />
              </mesh>
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
            {level === '1F' && <Escalator />}
            {level === 'B1' && <UndergroundTracks />}
            <ElevatorShaft floor={level} />
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
            <ContactShadows position={[0, floorY - 0.12, 0]} opacity={0.35} scale={25} blur={2} />
          </group>
        );
      })}
      {robots.map((robot) => (
        <Robot
          key={robot.id}
          robot={robot}
          selected={selected === robot.id}
          onSelect={onSelect}
          showLidar={layers.lidar}
        />
      ))}
      <OrbitControls
        makeDefault
        target={[0, 0, 0]}
        minDistance={30}
        maxDistance={62}
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
    <Canvas shadows camera={{ position: [0, 24, 33], fov: 44 }} dpr={[1, 1.7]}>
      <Scene {...props} />
    </Canvas>
  );
}
