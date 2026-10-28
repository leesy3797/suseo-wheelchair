export const BOUNDS = { minX: -11.4, maxX: 11.4, minZ: -6.7, maxZ: 6.7 };

export const nodes = [
  { id: 'gate', label: '개찰구', x: -8, z: 0, floor: '1F', radius: 0.72 },
  { id: 'hall', label: '맞이방', x: -3, z: 0, floor: '1F', radius: 0.8 },
  { id: 'info', label: '안내센터', x: -0.4, z: -1.7, floor: '1F', radius: 0.7 },
  { id: 'lift', label: '엘리베이터', x: 3, z: -3, floor: '1F', radius: 0.9 },
  { id: 'platform', label: '승강장 연결통로', x: 7, z: 0, floor: '1F', radius: 0.8 },
  { id: 'charge', label: '충전존', x: -6, z: 4, floor: '1F', radius: 0.78 },
  { id: 'kiosk', label: '호출 키오스크', x: 2.55, z: 4.3, floor: '1F', radius: 0.72 },
  { id: 'exit', label: '출구', x: 9.9, z: 3.4, floor: '1F', radius: 0.72 },
  { id: 'stairs', label: '계단·에스컬레이터', x: 4, z: 2, floor: '1F', forbidden: true },
  { id: 'b1_lift', label: 'B1 엘리베이터', x: 3, z: -3, floor: 'B1', radius: 0.9 },
  { id: 'b1_concourse', label: 'B1 연결통로', x: 3, z: 3.8, floor: 'B1', radius: 0.8 },
  { id: 'b1_platform_west', label: '1번 승강장', x: -8, z: 3.8, floor: 'B1', radius: 0.8 },
  { id: 'b1_platform_east', label: '2번 승강장', x: 8, z: 3.8, floor: 'B1', radius: 0.8 },
];

const links = {
  gate: ['hall'],
  hall: ['gate', 'info', 'charge', 'kiosk'],
  info: ['hall', 'lift'],
  lift: ['info', 'platform', 'b1_lift'],
  platform: ['lift', 'exit'],
  charge: ['hall'],
  kiosk: ['hall', 'exit'],
  exit: ['platform', 'kiosk'],
  stairs: ['kiosk', 'lift', 'exit'],
  b1_lift: ['lift', 'b1_concourse'],
  b1_concourse: ['b1_lift', 'b1_platform_west', 'b1_platform_east'],
  b1_platform_west: ['b1_concourse'],
  b1_platform_east: ['b1_concourse'],
};

export const buildings = [
  { id: 'gate', x: -7, z: -2.5, w: 4, d: 2.5, label: '개찰구', color: '#173b55', floor: '1F' },
  { id: 'hall', x: -2, z: -3.5, w: 4.2, d: 2, label: '맞이방 · 대합실', color: '#1c3854', floor: '1F' },
  { id: 'lift', x: 3, z: -5, w: 3, d: 1.8, label: '엘리베이터 홀', color: '#25435e', floor: '1F' },
  { id: 'platform', x: 8, z: -2, w: 4, d: 2.5, label: '승강장 연결', color: '#173b55', floor: '1F' },
  { id: 'charge', x: -8, z: 4.5, w: 2.2, d: 1.5, label: '충전존', color: '#16443f', floor: '1F' },
  { id: 'kiosk', x: 1, z: 5, w: 2, d: 1.4, label: '호출 키오스크', color: '#25435e', floor: '1F' },
  { id: 'exit', x: 8, z: 4.5, w: 2.4, d: 1.5, label: '출구 · 환승', color: '#1c3854', floor: '1F' },
];

export const pillars = [
  { id: 'p1', x: -4.2, z: -1.6, r: 0.38, floor: '1F' },
  { id: 'p2', x: 2.2, z: 0.4, r: 0.38, floor: '1F' },
  { id: 'p3', x: 5.4, z: -1.2, r: 0.34, floor: '1F' },
  { id: 'p4', x: -1.2, z: 2.6, r: 0.32, floor: '1F' },
];

export const geofences = [
  { id: 'stairs', x: 4, z: 2, r: 1.15, label: '휠체어 금지', floor: '1F' },
];

export const WANDER = [
  [-8.5, 1.6], [-5.5, 0.2], [-2.8, 1.8], [0.4, 1.2], [2.6, 1.6],
  [6.2, 1.4], [9.2, 1.2], [-8.2, -0.2], [-4.8, 3.4], [0.2, 2.8],
  [4.8, 3.6], [8.6, 2.6], [-1.6, -1.4], [4.6, -1.6], [9.4, -0.2],
];

export function hypot(ax, az, bx, bz) {
  return Math.hypot(ax - bx, az - bz);
}

function stampEvent(type, text) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    time: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
    type,
    text,
  };
}

function withEvents(world, extra) {
  if (!extra?.length) return world;
  return { ...world, eventLog: [...extra, ...(world.eventLog || [])].slice(0, 24) };
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function nodeById(id) {
  return nodes.find((n) => n.id === id) || nodes[0];
}

export function nodeLabel(id) {
  return nodeById(id).label;
}

export function nearestNode(x, z, wheelchair = true, floor = '1F') {
  let best = nodes.find((n) => n.floor === floor && (!wheelchair || !n.forbidden)) || nodes[0];
  let bestD = Infinity;
  for (const n of nodes) {
    if (n.floor !== floor || (wheelchair && n.forbidden)) continue;
    const d = hypot(x, z, n.x, n.z);
    if (d < bestD) {
      best = n;
      bestD = d;
    }
  }
  return best;
}

export function resolveMapTarget(x, z, floor = '1F', extras = []) {
  const radius = 0.42;
  const isFree = (px, pz) => {
    if (
      px < BOUNDS.minX + radius || px > BOUNDS.maxX - radius
      || pz < BOUNDS.minZ + radius || pz > BOUNDS.maxZ - radius
    ) return false;
    for (const building of buildings) {
      if ((building.floor || '1F') === floor && rectangleClearance(px, pz, building, radius) < 0.12) return false;
    }
    for (const pillar of pillars) {
      if ((pillar.floor || '1F') === floor && hypot(px, pz, pillar.x, pillar.z) < pillar.r + radius + 0.12) return false;
    }
    for (const fence of geofences) {
      if ((fence.floor || '1F') === floor && hypot(px, pz, fence.x, fence.z) < fence.r + radius + 0.12) return false;
    }
    for (const extra of extras) {
      if ((extra.floor || '1F') === floor && hypot(px, pz, extra.x, extra.z) < extra.r + radius + 0.12) return false;
    }
    return true;
  };
  if (isFree(x, z)) return { x, z, floor };
  for (let distance = 0.2; distance <= 4; distance += 0.2) {
    for (let index = 0; index < 32; index += 1) {
      const angle = (index / 32) * Math.PI * 2;
      const px = x + Math.cos(angle) * distance;
      const pz = z + Math.sin(angle) * distance;
      if (isFree(px, pz)) return { x: px, z: pz, floor };
    }
  }
  return null;
}

const PATH_STEP = 0.45;
const ROBOT_RADIUS = 0.42;

function mapPositionFree(x, z, floor, extras = []) {
  if (
    x < BOUNDS.minX + ROBOT_RADIUS || x > BOUNDS.maxX - ROBOT_RADIUS
    || z < BOUNDS.minZ + ROBOT_RADIUS || z > BOUNDS.maxZ - ROBOT_RADIUS
  ) return false;
  for (const building of buildings) {
    if ((building.floor || '1F') === floor && rectangleClearance(x, z, building, ROBOT_RADIUS) < 0.12) return false;
  }
  for (const pillar of pillars) {
    if ((pillar.floor || '1F') === floor && hypot(x, z, pillar.x, pillar.z) < pillar.r + ROBOT_RADIUS + 0.12) return false;
  }
  for (const fence of geofences) {
    if ((fence.floor || '1F') === floor && hypot(x, z, fence.x, fence.z) < fence.r + ROBOT_RADIUS + 0.12) return false;
  }
  for (const extra of extras) {
    if ((extra.floor || '1F') === floor && hypot(x, z, extra.x, extra.z) < extra.r + ROBOT_RADIUS + 0.12) return false;
  }
  return true;
}

function segmentIsFree(a, b, floor, extras = []) {
  const distance = hypot(a.x, a.z, b.x, b.z);
  const samples = Math.ceil(distance / 0.18);
  for (let index = 0; index <= samples; index += 1) {
    const t = samples ? index / samples : 0;
    if (!mapPositionFree(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t, floor, extras)) return false;
  }
  return true;
}

function findSameFloorPath(start, goal, floor, extras = []) {
  const resolvedStart = mapPositionFree(start.x, start.z, floor, extras)
    ? start
    : resolveMapTarget(start.x, start.z, floor, extras);
  const resolvedGoal = mapPositionFree(goal.x, goal.z, floor, extras)
    ? goal
    : resolveMapTarget(goal.x, goal.z, floor, extras);
  if (
    !resolvedStart || !resolvedGoal
    || hypot(resolvedGoal.x, resolvedGoal.z, goal.x, goal.z) > (goal.snapRadius || goal.radius || 0.62)
  ) return null;

  const toCell = (point) => ({
    x: Math.round((point.x - BOUNDS.minX) / PATH_STEP),
    z: Math.round((point.z - BOUNDS.minZ) / PATH_STEP),
  });
  const toPoint = (cell) => ({
    x: BOUNDS.minX + cell.x * PATH_STEP,
    z: BOUNDS.minZ + cell.z * PATH_STEP,
  });
  const nearestFreeCell = (point) => {
    const origin = toCell(point);
    for (let radius = 0; radius <= 6; radius += 1) {
      for (let x = -radius; x <= radius; x += 1) {
        for (let z = -radius; z <= radius; z += 1) {
          if (radius && Math.abs(x) !== radius && Math.abs(z) !== radius) continue;
          const cell = { x: origin.x + x, z: origin.z + z };
          const candidate = toPoint(cell);
          if (mapPositionFree(candidate.x, candidate.z, floor, extras)
            && segmentIsFree(point, candidate, floor, extras)) return cell;
        }
      }
    }
    return null;
  };
  const startCell = nearestFreeCell(resolvedStart);
  const goalCell = nearestFreeCell(resolvedGoal);
  if (!startCell || !goalCell) return null;
  const keyOf = (cell) => `${cell.x},${cell.z}`;
  const pointFor = (cell) => toPoint(cell);
  const startKey = keyOf(startCell);
  const goalKey = keyOf(goalCell);
  const open = [{ ...startCell, key: startKey, f: hypot(startCell.x, startCell.z, goalCell.x, goalCell.z) }];
  const cameFrom = new Map();
  const cost = new Map([[startKey, 0]]);
  const closed = new Set();
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [-1, 1], [1, -1], [1, 1],
  ];

  while (open.length) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift();
    if (closed.has(current.key)) continue;
    if (current.key === goalKey) break;
    closed.add(current.key);
    for (const [dx, dz] of directions) {
      const neighbor = { x: current.x + dx, z: current.z + dz };
      const point = pointFor(neighbor);
      if (!mapPositionFree(point.x, point.z, floor, extras)) continue;
      if (dx && dz) {
        const sideA = pointFor({ x: current.x + dx, z: current.z });
        const sideB = pointFor({ x: current.x, z: current.z + dz });
        if (!mapPositionFree(sideA.x, sideA.z, floor, extras)
          || !mapPositionFree(sideB.x, sideB.z, floor, extras)) continue;
      }
      const key = keyOf(neighbor);
      if (closed.has(key)) continue;
      const nextCost = cost.get(current.key) + (dx && dz ? Math.SQRT2 : 1);
      if (nextCost >= (cost.get(key) ?? Infinity)) continue;
      cameFrom.set(key, current.key);
      cost.set(key, nextCost);
      open.push({
        ...neighbor,
        key,
        f: nextCost + hypot(neighbor.x, neighbor.z, goalCell.x, goalCell.z),
      });
    }
  }

  if (startKey !== goalKey && !cameFrom.has(goalKey)) return null;
  const cells = [goalCell];
  let cursor = goalKey;
  while (cursor !== startKey) {
    cursor = cameFrom.get(cursor);
    if (!cursor) return null;
    const [x, z] = cursor.split(',').map(Number);
    cells.push({ x, z });
  }
  cells.reverse();
  const raw = [resolvedStart, ...cells.map(pointFor), resolvedGoal];
  const smoothed = [raw[0]];
  let index = 0;
  while (index < raw.length - 1) {
    let next = raw.length - 1;
    while (next > index + 1 && !segmentIsFree(raw[index], raw[next], floor, extras)) next -= 1;
    smoothed.push(raw[next]);
    index = next;
  }
  return smoothed.slice(1).map((point) => ({ x: point.x, z: point.z, floor }));
}

export function findMapPath(start, goal, extras = []) {
  if (!start || !goal) return null;
  const startFloor = start.floor || '1F';
  const goalFloor = goal.floor || startFloor;
  if (startFloor === goalFloor) {
    return findSameFloorPath(start, goal, startFloor, extras);
  }
  const sourceLift = nodes.find((node) => node.id === (startFloor === 'B1' ? 'b1_lift' : 'lift'));
  const destinationLift = nodes.find((node) => node.id === (goalFloor === 'B1' ? 'b1_lift' : 'lift'));
  const toLift = findSameFloorPath(start, sourceLift, startFloor, extras);
  const fromLift = findSameFloorPath(destinationLift, goal, goalFloor, extras);
  if (!toLift || !fromLift) return null;
  return [
    ...toLift,
    { x: destinationLift.x, z: destinationLift.z, floor: goalFloor, elevator: true },
    ...fromLift,
  ];
}

function crowdCost(ax, az, bx, bz, pedestrians) {
  if (!pedestrians?.length) return 0;
  const mx = (ax + bx) / 2;
  const mz = (az + bz) / 2;
  let nearby = 0;
  for (const p of pedestrians) {
    if (hypot(mx, mz, p.x, p.z) < 1.8) nearby += 1;
  }
  return nearby * 0.55;
}

export function findRoute(from, to, pedestrians = [], wheelchair = true) {
  const start = nodeById(from);
  const end = nodeById(to);
  if (start.id === end.id) return [start.id];

  const heuristic = (node) => hypot(node.x, node.z, end.x, end.z) + (node.floor === end.floor ? 0 : 6);
  const open = [{ id: start.id, path: [start.id], g: 0, f: heuristic(start) }];
  const bestG = new Map();

  while (open.length) {
    open.sort((a, b) => a.f - b.f);
    const cur = open.shift();
    if (cur.id === end.id) return cur.path;
    const recorded = bestG.get(cur.id);
    if (recorded !== undefined && cur.g > recorded) continue;
    bestG.set(cur.id, cur.g);
    for (const nid of links[cur.id] || []) {
      const n = nodeById(nid);
      if (wheelchair && n.forbidden) continue;
      const prev = nodeById(cur.id);
      const step = hypot(prev.x, prev.z, n.x, n.z)
        + (prev.floor === n.floor ? 0 : 6)
        + crowdCost(prev.x, prev.z, n.x, n.z, pedestrians.filter((p) => p.floor === n.floor));
      const g = cur.g + step;
      const known = bestG.get(nid);
      if (known !== undefined && g >= known) continue;
      open.push({
        id: nid,
        path: [...cur.path, nid],
        g,
        f: g + heuristic(n),
      });
    }
  }
  return [];
}

export function routeDistance(route) {
  let d = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const a = nodeById(route[i]);
    const b = nodeById(route[i + 1]);
    d += hypot(a.x, a.z, b.x, b.z) + (a.floor === b.floor ? 0 : 6);
  }
  return d;
}

export function etaSeconds(robot) {
  if (robot.missionPath?.length) {
    let remaining = 0;
    let previous = { x: robot.x, z: robot.z, floor: robot.floor };
    for (const point of robot.missionPath.slice(robot.missionPathIndex || 0)) {
      remaining += hypot(previous.x, previous.z, point.x, point.z);
      if (previous.floor !== point.floor) remaining += 6;
      previous = point;
    }
    return remaining / Math.max(0.28, robot.speed || 0.35);
  }
  const route = robot.route || [];
  if (!route.length || robot.status === '대기' || robot.status === '승객 대기' || robot.status === '충전 중') return null;
  const next = nodeById(route[Math.min(robot.routeIndex + 1, route.length - 1)]);
  let remain = hypot(robot.x, robot.z, next.x, next.z) + (robot.floor === next.floor ? 0 : 6);
  if (robot.targetPoint) {
    const final = robot.targetPoint;
    remain += hypot(final.x, final.z, nodeById(route[route.length - 1]).x, nodeById(route[route.length - 1]).z);
  }
  for (let i = robot.routeIndex + 1; i < route.length - 1; i++) {
    const a = nodeById(route[i]);
    const b = nodeById(route[i + 1]);
    remain += hypot(a.x, a.z, b.x, b.z);
  }
  const v = Math.max(0.28, robot.speed || 0.35);
  return remain / v;
}

export function formatEta(seconds) {
  if (seconds == null) return '--:--';
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function inBuilding(x, z, padding = 0.35, floor = '1F') {
  return buildings.some((b) => {
    if ((b.floor || '1F') !== floor) return false;
    const hx = b.w / 2 + padding;
    const hz = b.d / 2 + padding;
    return Math.abs(x - b.x) < hx && Math.abs(z - b.z) < hz;
  });
}

function pushOut(x, z, radius, floor = '1F') {
  let px = x;
  let pz = z;
  px = clamp(px, BOUNDS.minX + radius, BOUNDS.maxX - radius);
  pz = clamp(pz, BOUNDS.minZ + radius, BOUNDS.maxZ - radius);

  for (const b of buildings) {
    if ((b.floor || '1F') !== floor) continue;
    const hx = b.w / 2 + radius;
    const hz = b.d / 2 + radius;
    const dx = px - b.x;
    const dz = pz - b.z;
    if (Math.abs(dx) < hx && Math.abs(dz) < hz) {
      const ox = hx - Math.abs(dx);
      const oz = hz - Math.abs(dz);
      if (ox < oz) px += Math.sign(dx || 1) * ox;
      else pz += Math.sign(dz || 1) * oz;
    }
  }

  for (const p of pillars) {
    if ((p.floor || '1F') !== floor) continue;
    const d = hypot(px, pz, p.x, p.z);
    const min = p.r + radius;
    if (d < min && d > 1e-4) {
      const k = min / d;
      px = p.x + (px - p.x) * k;
      pz = p.z + (pz - p.z) * k;
    }
  }

  return { x: px, z: pz };
}

function randomWander() {
  for (let i = 0; i < 12; i++) {
    const [x, z] = WANDER[Math.floor(Math.random() * WANDER.length)];
    const jx = x + (Math.random() - 0.5) * 1.4;
    const jz = z + (Math.random() - 0.5) * 1.1;
    if (!inBuilding(jx, jz, 0.2, '1F')) return { x: jx, z: jz };
  }
  return { x: 0, z: 1.5 };
}

function spawnPedestrians(count) {
  return Array.from({ length: count }, (_, i) => {
    const spawn = randomWander();
    const goal = randomWander();
    return {
      id: `P-${String(i + 1).padStart(2, '0')}`,
      x: spawn.x,
      z: spawn.z,
      vx: 0,
      vz: 0,
      tx: goal.x,
      tz: goal.z,
      speed: 0.55 + Math.random() * 0.55,
      pause: Math.random() * 2,
      hue: i % 2,
      floor: '1F',
    };
  });
}

function makeRobot({ id, name, x, z, floor = '1F', battery, status, target, route, occupied, color, cruise }) {
  return {
    id,
    name,
    x,
    z,
    floor,
    heading: 0,
    battery,
    status,
    target,
    route,
    routeIndex: 0,
    occupied,
    color,
    cruise,
    speed: 0,
    nearestDist: 8,
    avoiding: false,
    stuck: 0,
    replanCool: 0,
    missCool: 0,
    pedestrianWait: 0,
    elevator: null,
    targetPoint: null,
    originPoint: null,
    missionPath: null,
    missionPathIndex: 0,
    missionStartIndex: 0,
    plannedMissionPath: null,
  };
}

export function createWorld() {
  const world = {
    robots: [
      makeRobot({
        id: 'SW-01',
        name: '모빌리티 01',
        x: -4,
        z: 0.2,
        battery: 86,
        status: '이동 중',
        target: 'platform',
        route: ['hall', 'info', 'lift', 'platform'],
        occupied: true,
        color: '#20e3cf',
        cruise: 0.82,
      }),
      makeRobot({
        id: 'SW-02',
        name: '모빌리티 02',
        x: 1,
        z: 3.2,
        battery: 64,
        status: '승객 대기',
        target: 'kiosk',
        route: ['kiosk'],
        occupied: false,
        color: '#6aa7ff',
        cruise: 0.78,
      }),
      makeRobot({
        id: 'SW-03',
        name: '모빌리티 03',
        x: -5.4,
        z: 3.6,
        battery: 18,
        status: '충전 복귀',
        target: 'charge',
        route: ['hall', 'charge'],
        occupied: false,
        color: '#f6bd60',
        cruise: 0.7,
      }),
    ],
    pedestrians: spawnPedestrians(20),
    extras: [],
    metrics: { nearMisses: 0, replans: 0, avoids: 0, arrivals: 0 },
    requestCount: 2,
    eventLog: [
      stampEvent('success', '가상 역사 시뮬레이터 기동 · 휠체어 3대'),
      stampEvent('info', '보행자 에이전트 20명 스폰 · 혼잡 회피 활성'),
      stampEvent('warn', 'SW-03 배터리 20% 미만 · 충전 복귀 경로 생성'),
    ],
  };
  const robots = world.robots.map((robot) => {
    if (!['이동 중', '충전 복귀'].includes(robot.status)) return robot;
    const destination = nodeById(robot.target);
    const targetPoint = {
      x: destination.x,
      z: destination.z,
      floor: destination.floor,
      radius: destination.radius,
    };
    const missionPath = findMapPath(
      { x: robot.x, z: robot.z, floor: robot.floor },
      targetPoint,
    );
    return {
      ...robot,
      route: [destination.id],
      targetPoint,
      missionPath,
      missionPathIndex: 0,
      plannedMissionPath: missionPath,
    };
  });
  return { ...world, robots };
}

export function addRobot(world) {
  const index = world.robots.length + 1;
  const candidates = [
    { x: -9.8, z: 1.8 },
    { x: -6.2, z: 2.2 },
    { x: 0, z: 5.9 },
    { x: 6.4, z: 5.7 },
    { x: 9.8, z: 1.7 },
    { x: -10, z: -0.5 },
  ];
  const spawn = candidates.find((candidate) =>
    buildings.every((building) => rectangleClearance(candidate.x, candidate.z, building, 0.42) >= 0.12)
      && pillars.every((pillar) => hypot(candidate.x, candidate.z, pillar.x, pillar.z) >= pillar.r + 0.54)
      && world.robots.every((robot) => robot.floor !== '1F' || hypot(robot.x, robot.z, candidate.x, candidate.z) >= 1.1),
  );
  if (!spawn) {
    return {
      world: withEvents(world, [stampEvent('warn', '빈 배치 공간이 없어 휠체어를 추가하지 못했습니다')]),
      addedId: null,
    };
  }
  const colors = ['#20e3cf', '#6aa7ff', '#f6bd60', '#bb8cff', '#ff7b91', '#86df8c'];
  const id = `SW-${String(index).padStart(2, '0')}`;
  const robot = makeRobot({
    id,
    name: `모빌리티 ${String(index).padStart(2, '0')}`,
    ...spawn,
    battery: 100,
    status: '대기',
    target: 'gate',
    route: ['gate'],
    occupied: false,
    color: colors[(index - 1) % colors.length],
    cruise: 0.72,
  });
  return {
    world: withEvents({ ...world, robots: [...world.robots, robot] }, [stampEvent('success', `${id} 휠체어 플릿에 추가`) ]),
    addedId: id,
  };
}

export function scenarioObstacles() {
  return [
    { id: 'bag-1', x: -1.2, z: 0.15, r: 0.42, kind: 'luggage' },
    { id: 'bag-2', x: 0.6, z: -0.35, r: 0.36, kind: 'cone' },
    { id: 'bag-3', x: 2.8, z: 0.55, r: 0.4, kind: 'luggage' },
  ];
}

function repulsion(x, z, ox, oz, radius) {
  const dx = x - ox;
  const dz = z - oz;
  const d = Math.hypot(dx, dz) || 0.0001;
  if (d >= radius) return { x: 0, z: 0, d };
  const mag = ((radius - d) / radius) ** 2;
  return { x: (dx / d) * mag, z: (dz / d) * mag, d };
}

function rectangleClearance(x, z, building, radius) {
  const dx = Math.abs(x - building.x) - building.w / 2;
  const dz = Math.abs(z - building.z) - building.d / 2;
  if (dx <= 0 && dz <= 0) return -Math.min(-dx, -dz) - radius;
  return Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) - radius;
}

function chooseSafeVelocity(robot, goal, pedestrians, robots, extras) {
  const dx = goal.x - robot.x;
  const dz = goal.z - robot.z;
  const distance = Math.hypot(dx, dz) || 1;
  const desiredAngle = Math.atan2(dz, dx);
  const radius = 0.42;
  const horizon = 1.5;
  let best = { x: 0, z: 0, clearance: -Infinity };
  let bestScore = -Infinity;

  for (const speedScale of [1, 0.65, 0.3]) {
    for (let angleOffset = -120; angleOffset <= 120; angleOffset += 20) {
      const angle = desiredAngle + (angleOffset * Math.PI) / 180;
      const vx = Math.cos(angle) * robot.cruise * speedScale;
      const vz = Math.sin(angle) * robot.cruise * speedScale;
      let penalty = 0;
      let minimumClearance = Infinity;

      for (let step = 1; step <= 6; step++) {
        const time = (horizon * step) / 6;
        const x = robot.x + vx * time;
        const z = robot.z + vz * time;
        let clearance = Math.min(
          x - BOUNDS.minX - radius,
          BOUNDS.maxX - x - radius,
          z - BOUNDS.minZ - radius,
          BOUNDS.maxZ - z - radius,
        );
        for (const building of buildings) {
          if ((building.floor || '1F') !== robot.floor) continue;
          clearance = Math.min(clearance, rectangleClearance(x, z, building, radius));
        }
        for (const pedestrian of pedestrians) {
          if ((pedestrian.floor || '1F') !== robot.floor) continue;
          const px = pedestrian.x + pedestrian.vx * time;
          const pz = pedestrian.z + pedestrian.vz * time;
          clearance = Math.min(clearance, hypot(x, z, px, pz) - 0.48);
        }
        for (const extra of extras) {
          if ((extra.floor || '1F') !== robot.floor) continue;
          clearance = Math.min(clearance, hypot(x, z, extra.x, extra.z) - extra.r - radius);
        }
        for (const pillar of pillars) {
          if ((pillar.floor || '1F') !== robot.floor) continue;
          clearance = Math.min(clearance, hypot(x, z, pillar.x, pillar.z) - pillar.r - radius);
        }
        for (const fence of geofences) {
          if ((fence.floor || '1F') !== robot.floor) continue;
          clearance = Math.min(clearance, hypot(x, z, fence.x, fence.z) - fence.r - radius);
        }
        for (const other of robots) {
          if (other.id === robot.id || other.floor !== robot.floor) continue;
          clearance = Math.min(clearance, hypot(x, z, other.x, other.z) - 0.9);
        }

        minimumClearance = Math.min(minimumClearance, clearance);
        if (clearance < 0.08) penalty += 80 + (0.08 - clearance) * 80;
        else if (clearance < 0.45) penalty += (0.45 - clearance) ** 2 * 8;
      }

      const endDistance = hypot(robot.x + vx * horizon, robot.z + vz * horizon, goal.x, goal.z);
      const progress = distance - endDistance;
      const alignment = (vx * dx + vz * dz) / (robot.cruise * distance);
      const score = progress * 2.5 + alignment * 0.18 - penalty;
      if (score > bestScore) {
        bestScore = score;
        best = { x: vx, z: vz, clearance: minimumClearance };
      }
    }
  }
  if (best.clearance < 0.08) return { x: 0, z: 0, clearance: best.clearance, blocked: true };
  return best;
}

function tickPedestrians(pedestrians, robots, extras, dt) {
  return pedestrians.map((p) => {
    let pause = p.pause - dt;
    let tx = p.tx;
    let tz = p.tz;
    if (hypot(p.x, p.z, tx, tz) < 0.45) {
      const g = randomWander();
      tx = g.x;
      tz = g.z;
      pause = Math.random() < 0.22 ? 1.2 + Math.random() * 2.4 : 0;
    }

    let vx = 0;
    let vz = 0;
    if (pause <= 0) {
      const dx = tx - p.x;
      const dz = tz - p.z;
      const d = Math.hypot(dx, dz) || 1;
      vx = (dx / d) * p.speed;
      vz = (dz / d) * p.speed;
    }

    for (const o of pedestrians) {
      if (o.id === p.id || (o.floor || '1F') !== (p.floor || '1F')) continue;
      const r = repulsion(p.x, p.z, o.x, o.z, 0.7);
      vx += r.x * 1.4;
      vz += r.z * 1.4;
    }
    for (const rbt of robots) {
      if (rbt.floor !== (p.floor || '1F')) continue;
      const r = repulsion(p.x, p.z, rbt.x, rbt.z, 1.05);
      vx += r.x * 2.1;
      vz += r.z * 2.1;
    }
    for (const e of extras) {
      if ((e.floor || '1F') !== (p.floor || '1F')) continue;
      const r = repulsion(p.x, p.z, e.x, e.z, e.r + 0.45);
      vx += r.x * 1.8;
      vz += r.z * 1.8;
    }

    let x = p.x + vx * dt;
    let z = p.z + vz * dt;
    ({ x, z } = pushOut(x, z, 0.16, p.floor));
    return { ...p, x, z, vx, vz, tx, tz, pause };
  });
}

function movingStatus(status) {
  return status === '이동 중' || status === '충전 복귀' || status === '회피 중'
    || status === '경로 재계획' || status === '보행자 대기';
}

function tickRobot(robot, ctx) {
  const { dt, robots, pedestrians, extras, flags, events, metrics } = ctx;
  let next = {
    ...robot,
    replanCool: Math.max(0, robot.replanCool - dt),
    missCool: Math.max(0, robot.missCool - dt),
  };

  if (flags.estop) {
    return { ...next, speed: 0, status: '비상 정지', avoiding: false };
  }

  if (next.elevator) {
    const elapsed = Math.min(next.elevator.duration, next.elevator.elapsed + dt);
    if (elapsed < next.elevator.duration) {
      return {
        ...next,
        elevator: { ...next.elevator, elapsed },
        speed: 0,
        status: '엘리베이터 이동',
      };
    }
    const destination = nodeById(next.elevator.destinationId);
    events.push(stampEvent('info', `${next.id} ${next.elevator.toFloor} 엘리베이터 도착`));
    return {
      ...next,
      x: destination.x,
      z: destination.z,
      floor: next.elevator.toFloor,
      elevator: null,
      routeIndex: next.routeIndex + 1,
      missionPathIndex: next.missionPath ? next.missionPathIndex + 1 : next.missionPathIndex,
      speed: 0,
      status: next.target === 'charge' ? '충전 복귀' : '이동 중',
    };
  }

  let battery = next.battery;
  if (next.status === '충전 중') battery = Math.min(100, battery + 6.5 * dt);
  else if (movingStatus(next.status)) battery = Math.max(4, battery - 0.55 * dt);
  else battery = Math.max(4, battery - 0.12 * dt);

  if (
    flags.autoReturn &&
    !next.occupied &&
    battery < 20 &&
    next.status !== '충전 중' &&
    next.target !== 'charge'
  ) {
    const from = nearestNode(next.x, next.z, true, next.floor).id;
    const route = findRoute(from, 'charge', pedestrians, true);
    events.push(stampEvent('info', `${next.id} 배터리 ${Math.round(battery)}% · 충전 복귀`));
    next = { ...next, battery, status: '충전 복귀', target: 'charge', route, routeIndex: 0, occupied: false, stuck: 0 };
  } else {
    next = { ...next, battery };
  }

  if (next.status === '충전 중') {
    if (battery >= 99.5) {
      events.push(stampEvent('success', `${next.id} 충전 완료 · 대기 전환`));
      return { ...next, battery: 100, status: '대기', speed: 0, occupied: false };
    }
    return { ...next, speed: 0 };
  }

  if (!movingStatus(next.status)) {
    return { ...next, speed: 0, avoiding: false };
  }

  let route = next.route || [];
  let missionPath = next.missionPath;
  let missionPathIndex = next.missionPathIndex || 0;
  let missionStartIndex = next.missionStartIndex || 0;
  let originPoint = next.originPoint;
  let targetPoint = next.targetPoint;
  const missionPathActive = Array.isArray(missionPath) && missionPath.length > 0;
  if (
    missionPathActive
    && next.replanCool <= 0
    && missionPathIndex < missionPath.length
    && missionPath[missionPathIndex].floor === next.floor
    && !segmentIsFree(
      { x: next.x, z: next.z },
      missionPath[missionPathIndex],
      next.floor,
      extras,
    )
  ) {
    const currentPoint = { x: next.x, z: next.z, floor: next.floor };
    const mustReachOrigin = next.originPoint && missionPathIndex < missionStartIndex;
    const toMilestone = findMapPath(
      currentPoint,
      mustReachOrigin ? { ...originPoint, snapRadius: 2 } : { ...targetPoint, snapRadius: 2 },
      extras,
    );
    if (mustReachOrigin && toMilestone?.length) {
      const reachableOrigin = toMilestone[toMilestone.length - 1];
      originPoint = { ...originPoint, x: reachableOrigin.x, z: reachableOrigin.z, floor: reachableOrigin.floor };
    } else if (toMilestone?.length) {
      const reachableDestination = toMilestone[toMilestone.length - 1];
      targetPoint = { ...targetPoint, x: reachableDestination.x, z: reachableDestination.z, floor: reachableDestination.floor };
    }
    const afterMilestone = mustReachOrigin
      ? findMapPath(originPoint, { ...targetPoint, snapRadius: 2 }, extras)
      : [];
    if (toMilestone?.length && afterMilestone) {
      missionPath = [...toMilestone, ...afterMilestone];
      missionStartIndex = mustReachOrigin ? toMilestone.length : 0;
      if (mustReachOrigin && afterMilestone.length) {
        const reachableDestination = afterMilestone[afterMilestone.length - 1];
        targetPoint = { ...targetPoint, x: reachableDestination.x, z: reachableDestination.z, floor: reachableDestination.floor };
      }
      missionPathIndex = 0;
      next.replanCool = 1.2;
      next.stuck = 0;
      metrics.replans += 1;
      events.push(stampEvent('warn', `${next.id} 장애물 감지 · 최단 경로 재계획`));
    }
  }
  const currentRouteIndex = Math.min(next.routeIndex, Math.max(0, route.length - 1));
  const isPastLastWaypoint = missionPathActive
    ? missionPathIndex >= missionPath.length - 1
    : currentRouteIndex >= route.length - 1;
  const goalId = route[Math.min(currentRouteIndex + 1, route.length - 1)] || next.target;
  const goal = missionPathActive
    ? missionPath[Math.min(missionPathIndex, missionPath.length - 1)]
    : targetPoint && isPastLastWaypoint
      ? targetPoint
      : nodeById(goalId);
  const gdx = goal.x - next.x;
  const gdz = goal.z - next.z;
  const gd = Math.hypot(gdx, gdz) || 1;
  const legacyElevatorFloor = !missionPathActive && !isPastLastWaypoint
    && nodeById(goalId).floor !== next.floor
    && (route[currentRouteIndex] === 'lift' || route[currentRouteIndex] === 'b1_lift')
    ? nodeById(goalId).floor
    : null;

  if (
    ((missionPathActive && goal.floor !== next.floor) || legacyElevatorFloor)
    && gd < 0.42
  ) {
    const destinationFloor = missionPathActive ? goal.floor : legacyElevatorFloor;
    const destinationId = missionPathActive
      ? destinationFloor === 'B1' ? 'b1_lift' : 'lift'
      : goalId;
    events.push(stampEvent('info', `${next.id} 엘리베이터 탑승 · ${destinationFloor} 이동`));
    return {
      ...next,
      elevator: {
        fromFloor: next.floor,
        toFloor: destinationFloor,
        destinationId,
        elapsed: 0,
        duration: 3.2,
      },
      speed: 0,
      status: '엘리베이터 이동',
      avoiding: false,
    };
  }

  let wx = (gdx / gd) * next.cruise;
  let wz = (gdz / gd) * next.cruise;

  let nearest = 8;
  let avoidX = 0;
  let avoidZ = 0;
  const currentPedestrians = pedestrians.filter((p) => (p.floor || '1F') === next.floor);
  const directionX = gdx / gd;
  const directionZ = gdz / gd;
  const pedestrianBlocked = currentPedestrians.some((pedestrian) => {
    const dx = pedestrian.x - next.x;
    const dz = pedestrian.z - next.z;
    const forward = dx * directionX + dz * directionZ;
    const side = Math.abs(dx * directionZ - dz * directionX);
    const distance = Math.hypot(dx, dz);
    const approaching = pedestrian.vx * -directionX + pedestrian.vz * -directionZ > 0.12;
    return distance < 1.05 || (forward > 0 && forward < 1.9 && side < 0.62)
      || (approaching && forward > 0 && forward < 2.4 && side < 0.85);
  });
  let pedestrianWait = Math.max(0, next.pedestrianWait - dt);
  if (pedestrianBlocked) pedestrianWait = 0.45;

  const addAvoid = (ax, az, radius, weight) => {
    const r = repulsion(next.x, next.z, ax, az, radius);
    nearest = Math.min(nearest, r.d);
    avoidX += r.x * weight;
    avoidZ += r.z * weight;
  };

  if (!pedestrianBlocked && pedestrianWait <= 0) {
    for (const p of currentPedestrians) addAvoid(p.x, p.z, 1.0, 0.55);
  }
  for (const e of extras) {
    if ((e.floor || '1F') === next.floor) addAvoid(e.x, e.z, e.r + 1.15, 2.4);
  }
  for (const col of pillars) {
    if ((col.floor || '1F') === next.floor) addAvoid(col.x, col.z, col.r + 0.85, 2.2);
  }
  for (const g of geofences) {
    if ((g.floor || '1F') === next.floor) addAvoid(g.x, g.z, g.r + 0.35, 2.6);
  }
  for (const other of robots) {
    if (other.id === next.id || other.floor !== next.floor) continue;
    addAvoid(other.x, other.z, 1.35, 2.0);
  }

  const safeVelocity = chooseSafeVelocity(next, goal, currentPedestrians, robots, extras);
  wx = pedestrianBlocked || pedestrianWait > 0
    ? 0
    : safeVelocity.x + avoidX * next.cruise * 0.25;
  wz = pedestrianBlocked || pedestrianWait > 0
    ? 0
    : safeVelocity.z + avoidZ * next.cruise * 0.25;

  const avoidMag = Math.hypot(avoidX, avoidZ);
  const predictiveAvoiding = Math.hypot(
    safeVelocity.x - (gdx / gd) * next.cruise,
    safeVelocity.z - (gdz / gd) * next.cruise,
  ) > 0.18;
  const avoiding = !pedestrianBlocked && pedestrianWait <= 0
    && (safeVelocity.blocked || predictiveAvoiding || avoidMag > 0.28 || nearest < 1.25);
  if (safeVelocity.blocked && !pedestrianBlocked && next.replanCool <= 0) {
    next.replanCool = 1.2;
    next.stuck += dt;
  }
  if (avoiding) metrics.avoids += dt;

  if (nearest < 0.72 && next.missCool <= 0) {
    metrics.nearMisses += 1;
    next.missCool = 2.4;
    events.push(stampEvent('warn', `${next.id} 근접 회피 · 이격 ${nearest.toFixed(1)}m`));
  }

  let speedVec = Math.hypot(wx, wz);
  if (speedVec > next.cruise) {
    wx = (wx / speedVec) * next.cruise;
    wz = (wz / speedVec) * next.cruise;
    speedVec = next.cruise;
  }
  if (nearest < 0.7 && !pedestrianBlocked) {
    wx *= 0.15;
    wz *= 0.15;
    speedVec *= 0.15;
  } else if (nearest < 1.1 && !pedestrianBlocked) {
    wx *= 0.45;
    wz *= 0.45;
    speedVec *= 0.45;
  }

  let x = next.x + wx * dt;
  let z = next.z + wz * dt;
  ({ x, z } = pushOut(x, z, 0.42, next.floor));
  for (const g of geofences) {
    if ((g.floor || '1F') !== next.floor) continue;
    const d = hypot(x, z, g.x, g.z);
    if (d < g.r) {
      const k = g.r / (d || 0.001);
      x = g.x + (x - g.x) * k;
      z = g.z + (z - g.z) * k;
    }
  }

  const moved = hypot(x, z, next.x, next.z);
  let stuck = moved < 0.012 ? next.stuck + dt : 0;
  let status = pedestrianBlocked || pedestrianWait > 0
    ? '보행자 대기'
    : safeVelocity.blocked ? '경로 재계획'
      : avoiding ? '회피 중' : next.target === 'charge' ? '충전 복귀' : '이동 중';
  let routeIndex = next.routeIndex;
  let nextRoute = route;

  const goalTolerance = missionPathActive
    ? 0.2
      : targetPoint && isPastLastWaypoint
    ? targetPoint.radius || 0.52
    : isPastLastWaypoint ? (nodeById(next.target).radius || 0.7) : 0.32;
  const mapDestinationReached = !missionPathActive || !isPastLastWaypoint
    || Math.hypot(next.x - targetPoint.x, next.z - targetPoint.z)
      <= (targetPoint.radius || 0.62);
  if (gd < goalTolerance && mapDestinationReached) {
    if (isPastLastWaypoint) {
      const arrived = nodeLabel(next.target);
      metrics.arrivals += 1;
      if (next.target === 'charge') {
        events.push(stampEvent('success', `${next.id} 충전 스테이션 도착`));
        return {
          ...next,
          x: goal.x,
          z: goal.z,
          targetPoint: null,
          originPoint: null,
          missionPath: null,
          missionPathIndex: 0,
          missionStartIndex: 0,
          plannedMissionPath: null,
          speed: 0,
          status: '충전 중',
          occupied: false,
          nearestDist: nearest,
          avoiding: false,
          heading: next.heading,
          stuck: 0,
        };
      }
      events.push(stampEvent('success', `${next.id} 목적지 도착 · ${arrived}`));
      return {
        ...next,
        x: goal.x,
        z: goal.z,
        targetPoint: null,
        originPoint: null,
        missionPath: null,
        missionPathIndex: 0,
        missionStartIndex: 0,
        plannedMissionPath: null,
        speed: 0,
        status: next.occupied ? '승객 대기' : '대기',
        occupied: false,
        nearestDist: nearest,
        avoiding: false,
        heading: next.heading,
        stuck: 0,
        routeIndex: route.length - 1,
      };
    }
    if (missionPathActive) {
      missionPathIndex += 1;
    } else {
      routeIndex += 1;
    }
  } else if ((stuck > 1.15 || safeVelocity.blocked) && next.replanCool <= 0) {
    if (missionPathActive) {
      const currentPoint = { x, z, floor: next.floor };
      const mustReachOrigin = originPoint && missionPathIndex < missionStartIndex;
      const toMilestone = findMapPath(
        currentPoint,
        mustReachOrigin ? { ...originPoint, snapRadius: 2 } : { ...targetPoint, snapRadius: 2 },
        extras,
      );
      if (mustReachOrigin && toMilestone?.length) {
        const reachableOrigin = toMilestone[toMilestone.length - 1];
        originPoint = { ...originPoint, x: reachableOrigin.x, z: reachableOrigin.z, floor: reachableOrigin.floor };
      } else if (toMilestone?.length) {
        const reachableDestination = toMilestone[toMilestone.length - 1];
        targetPoint = { ...targetPoint, x: reachableDestination.x, z: reachableDestination.z, floor: reachableDestination.floor };
      }
      const afterMilestone = mustReachOrigin
        ? findMapPath(originPoint, { ...targetPoint, snapRadius: 2 }, extras)
        : [];
      if (toMilestone?.length && afterMilestone) {
        missionPath = [...toMilestone, ...afterMilestone];
        missionStartIndex = mustReachOrigin ? toMilestone.length : 0;
        if (mustReachOrigin && afterMilestone.length) {
          const reachableDestination = afterMilestone[afterMilestone.length - 1];
          targetPoint = { ...targetPoint, x: reachableDestination.x, z: reachableDestination.z, floor: reachableDestination.floor };
        }
        missionPathIndex = 0;
        metrics.replans += 1;
        next.replanCool = 2.8;
      } else {
        next.replanCool = 1.2;
      }
    } else {
      const from = nearestNode(x, z, true, next.floor).id;
      nextRoute = findRoute(from, next.target, pedestrians, true);
    }
    if (!missionPathActive && nextRoute.length) {
      metrics.replans += 1;
      next.replanCool = 2.8;
    } else if (!missionPathActive) {
      next.replanCool = 1.2;
    }
    stuck = 0;
    if (!missionPathActive) routeIndex = 0;
    status = '경로 재계획';
    events.push(stampEvent('warn', `${next.id} 혼잡으로 경로 재계획`));
  }

  const heading = speedVec > 0.05 ? Math.atan2(wx, wz) + Math.PI : next.heading;
  return {
    ...next,
    x,
    z,
    heading,
    speed: speedVec,
    nearestDist: nearest,
    avoiding,
    stuck,
    status,
    pedestrianWait,
    route: nextRoute,
    routeIndex,
    missionPath,
    missionPathIndex,
    missionStartIndex,
    originPoint,
    targetPoint,
  };
}

export function tickWorld(world, dt, flags) {
  const events = [];
  const metrics = { ...world.metrics };
  const extras = flags.obstacle ? world.extras : [];
  const pedestrians = tickPedestrians(world.pedestrians, world.robots, extras, dt);
  const robots = [];
  for (const robot of world.robots) {
    robots.push(
      tickRobot(robot, {
        dt,
        robots: world.robots,
        pedestrians,
        extras,
        flags,
        events,
        metrics,
      }),
    );
  }

  let nextPeds = pedestrians;
  if (flags.obstacle && pedestrians.length < 28 && Math.random() < dt * 0.4) {
    const spawn = { x: -0.4, z: 0.2 };
    nextPeds = [
      ...pedestrians,
      {
        id: `P-X${pedestrians.length}`,
        ...spawn,
        vx: 0,
        vz: 0,
        tx: 3.2,
        tz: 0.4,
        speed: 0.7,
        pause: 0,
        hue: 1,
      },
    ];
  }

  const eventLog = events.length ? [...events, ...(world.eventLog || [])].slice(0, 24) : world.eventLog || [];

  return {
    ...world,
    robots,
    pedestrians: nextPeds,
    metrics,
    eventLog,
  };
}

export function assignMission(world, robotId, from, to) {
  const events = [];
  const idle = world.robots.find((r) => r.id === robotId)
    || world.robots.find((r) => r.status === '대기' || r.status === '승객 대기')
    || world.robots[0];
  const start = nearestNode(idle.x, idle.z, true, idle.floor).id;
  const destination = typeof to === 'string'
    ? nodeById(to)
    : nearestNode(to.x, to.z, true, to.floor || idle.floor);
  const targetPoint = typeof to === 'string'
    ? null
    : { x: to.x, z: to.z, floor: to.floor || idle.floor, radius: to.radius || 0.62 };
  const originPoint = from && typeof from === 'object'
    ? { x: from.x, z: from.z, floor: from.floor || idle.floor, radius: from.radius || 0.5 }
    : null;
  const toOriginPath = originPoint && targetPoint
    ? findMapPath({ x: idle.x, z: idle.z, floor: idle.floor }, originPoint, world.extras)
    : null;
  const onwardPath = originPoint && targetPoint
    ? findMapPath(originPoint, targetPoint, world.extras)
    : null;
  const missionPath = originPoint && targetPoint && toOriginPath && onwardPath
    ? [...toOriginPath, ...onwardPath]
    : null;
  const route = originPoint && targetPoint
    ? missionPath ? [destination.id] : []
    : findRoute(start, destination.id, world.pedestrians, true);
  if ((missionPath && !missionPath.length) || !route.length) {
    events.push(stampEvent('warn', `${idle.id} 목적지까지 연결 경로가 없습니다`));
    return {
      world: withEvents(world, events),
      assignedId: idle.id,
    };
  }
  const robots = world.robots.map((r) =>
    r.id === idle.id
      ? {
          ...r,
          route,
          routeIndex: 0,
          target: destination.id,
          targetPoint,
          originPoint,
          missionPath,
          missionPathIndex: 0,
          missionStartIndex: toOriginPath?.length || 0,
          plannedMissionPath: onwardPath,
          status: '이동 중',
          occupied: true,
          stuck: 0,
          replanCool: 0,
          elevator: null,
        }
      : r,
  );
  events.push(stampEvent('success', `${idle.id} 배차 · ${originPoint ? '맵 출발지' : nodeLabel(start)} → ${targetPoint ? '맵 목적지' : nodeLabel(destination.id)}`));
  return {
    world: withEvents(
      { ...world, robots, requestCount: Math.max(0, world.requestCount - 1) },
      events,
    ),
    assignedId: idle.id,
  };
}

export function returnToCharge(world, robotId) {
  const events = [];
  const robots = world.robots.map((r) => {
    if (r.id !== robotId) return r;
    const from = nearestNode(r.x, r.z, true, r.floor).id;
    events.push(stampEvent('info', `${r.id} 충전 스테이션 복귀 명령`));
    return {
      ...r,
      occupied: false,
      target: 'charge',
      status: '충전 복귀',
      route: findRoute(from, 'charge', world.pedestrians, true),
      routeIndex: 0,
      stuck: 0,
      targetPoint: null,
      originPoint: null,
      missionPath: null,
      missionPathIndex: 0,
      missionStartIndex: 0,
      plannedMissionPath: null,
      elevator: null,
    };
  });
  return { world: withEvents({ ...world, robots }, events) };
}

export function congestionScore(pedestrians) {
  if (!pedestrians.length) return 0;
  const corridor = pedestrians.filter((p) => Math.abs(p.z) < 2.2 && p.x > -6 && p.x < 6);
  return Math.round((corridor.length / 8) * 100);
}

export function statusTone(status) {
  if (status === '비상 정지') return 'stopped';
  if (status === '충전 복귀' || status === '충전 중' || status === '경로 재계획') return 'charging';
  if (status === '대기' || status === '승객 대기') return 'idle';
  return 'moving';
}
