import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, BatteryCharging, Bell, Bot, ChevronDown, CircleAlert, Clock3, Cpu, Crosshair,
  Gauge, MapPin, Navigation, Pause, Play, Radio, Route, ShieldAlert, Signal, Siren, UserRound, Plus,
} from 'lucide-react';
import StationScene from './components/StationScene.jsx';
import {
  addRobot, assignMission, congestionScore, createWorld, etaSeconds, findMapPath, formatEta,
  nodeLabel, nodes, resolveMapTarget, returnToCharge, scenarioObstacles, statusTone, tickWorld,
} from './simulation.js';

const timeNow = () => new Date().toLocaleTimeString('ko-KR', { hour12: false });

function pushEvents(prev, incoming) {
  if (!incoming?.length) return prev;
  const stamped = incoming.map((e) => ({ ...e, time: timeNow(), id: `${Date.now()}-${Math.random()}` }));
  return [...stamped, ...prev].slice(0, 24);
}

export default Dashboard;

function Dashboard() {
  const [world, setWorld] = useState(createWorld);
  const [selected, setSelected] = useState('SW-01');
  const [paused, setPaused] = useState(false);
  const [estop, setEstop] = useState(false);
  const [autoReturn, setAutoReturn] = useState(true);
  const [obstacle, setObstacle] = useState(false);
  const [missionDraft, setMissionDraft] = useState(null);
  const [clock, setClock] = useState(timeNow);
  const [layers, setLayers] = useState({ path: true, lidar: true, crowd: true, geofence: true });
  const flagsRef = useRef({ paused, estop, autoReturn, obstacle });
  flagsRef.current = { paused, estop, autoReturn, obstacle };

  useEffect(() => {
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.08, (now - last) / 1000);
      last = now;
      setClock(timeNow());
      const flags = flagsRef.current;
      if (flags.paused || flags.estop) {
        if (flags.estop) {
          setWorld((w) => ({
            ...w,
            robots: w.robots.map((r) => ({ ...r, speed: 0, status: '비상 정지' })),
          }));
        }

        return;
      }
      setWorld((w) => tickWorld(w, dt, flags));
    }, 50);
    return () => clearInterval(id);
  }, []);

  const robots = world.robots;
  const active = robots.find((r) => r.id === selected) || robots[0];
  const events = world.eventLog || [];
  const log = (type, text) =>
    setWorld((w) => ({
      ...w,
      eventLog: pushEvents(w.eventLog || [], [{ type, text }]),
    }));
  const online = robots.length;
  const avgBattery = Math.round(robots.reduce((a, r) => a + r.battery, 0) / robots.length);
  const missions = robots.filter((r) => ['이동 중', '충전 복귀', '회피 중', '경로 재계획', '보행자 대기', '엘리베이터 이동'].includes(r.status)).length;
  const congestion = congestionScore(world.pedestrians);
  const avgSpeed = robots.reduce((a, r) => a + (r.speed || 0), 0) / robots.length;
  const draftRobot = missionDraft ? robots.find((r) => r.id === missionDraft.robotId) : null;
  const plannedPath = useMemo(() => {
    if (!missionDraft?.start || !missionDraft?.destination) return [];
    const path = findMapPath(missionDraft.start, missionDraft.destination, world.extras);
    return path?.length ? [missionDraft.start, ...path] : [];
  }, [missionDraft?.start, missionDraft?.destination, world.extras]);

  const startMissionSelection = (robotId = selected) => {
    const robot = robots.find((r) => r.id === robotId) || robots[0];
    setSelected(robot.id);
    setMissionDraft({
      robotId: robot.id,
      start: null,
      destination: null,
      selecting: 'start',
      selectionFloor: robot.floor,
    });
  };

  const selectRobot = (robotId) => {
    setSelected(robotId);
    const robot = robots.find((item) => item.id === robotId);
    setMissionDraft({
      robotId,
      start: null,
      destination: null,
      selecting: 'start',
      selectionFloor: robot?.floor || '1F',
    });
  };

  const selectMapPoint = (point) => {
    if (!missionDraft || !draftRobot || !missionDraft.selecting) return;
    const floor = missionDraft.selectionFloor || point.floor;
    const resolved = resolveMapTarget(point.x, point.z, floor, world.extras);
    if (!resolved) {
      log('warn', '선택 위치 주변에 휠체어가 접근할 수 있는 공간이 없습니다');
      return;
    }
    if (missionDraft.selecting === 'start') {
      const destinationReachable = Boolean(
        missionDraft.destination
        && findMapPath(resolved, missionDraft.destination, world.extras)?.length,
      );
      setMissionDraft({
        ...missionDraft,
        start: resolved,
        destination: destinationReachable ? missionDraft.destination : null,
        selecting: destinationReachable ? null : 'destination',
      });
      if (missionDraft.destination && !destinationReachable) {
        log('warn', '출발지를 변경해 기존 도착지를 초기화했습니다. 도착지를 다시 선택하세요');
      }
      return;
    }
    if (!missionDraft.start) {
      log('warn', '먼저 출발지를 지정하세요');
      setMissionDraft({ ...missionDraft, selecting: 'start' });
      return;
    }
    const route = findMapPath(missionDraft.start, resolved, world.extras);
    if (!route?.length) {
      log('warn', '출발지와 목적지 사이에 접근 가능한 경로가 없습니다');
      return;
    }
    setMissionDraft({ ...missionDraft, destination: resolved, selecting: null });
  };

  const selectMissionFloor = (floor) => {
    setMissionDraft((draft) => draft && ({
      ...draft,
      selectionFloor: floor,
      selecting: draft.selecting || (draft.start ? 'destination' : 'start'),
    }));
  };

  const editMissionPoint = (field) => {
    setMissionDraft((draft) => draft && ({
      ...draft,
      selecting: field,
      selectionFloor: draft[field]?.floor || draft.selectionFloor,
    }));
  };

  const dispatch = () => {
    if (!missionDraft?.start || !missionDraft.destination) return;
    setWorld((w) => {
      const { world: next, assignedId } = assignMission(
        w,
        missionDraft.robotId,
        missionDraft.start,
        missionDraft.destination,
      );
      setSelected(assignedId);
      return next;
    });
    setMissionDraft(null);
  };

  const addFleetRobot = () => {
    setWorld((current) => {
      const { world: next, addedId } = addRobot(current);
      if (addedId) {
        setSelected(addedId);
      }
      return next;
    });
  };

  const injectObstacle = () => {
    setObstacle((v) => {
      const next = !v;
      setWorld((w) => ({ ...w, extras: next ? scenarioObstacles() : [] }));
      log('warn', next ? '복도 장애물·혼잡 시나리오 투입 · 로컬 회피 시작' : '장애물 시나리오 해제 · 기본 보행 흐름 복귀');
      return next;
    });
  };

  const triggerEStop = () => {
    const next = !estop;
    setEstop(next);
    if (!next) {
      setWorld((w) => ({
        ...w,
        robots: w.robots.map((r) => ({
          ...r,
          status: r.target === 'charge' && r.battery < 95 ? '충전 복귀' : (r.missionPath?.length || r.route?.length > 1) ? '이동 중' : '대기',
        })),
      }));
    }
    log(next ? 'danger' : 'success', next ? '비상 정지(E-STOP) · 시뮬레이터 전체 구동 정지' : '비상 정지 해제 · 시뮬 재개');
  };

  const passengerCall = () => {
    setWorld((w) => ({ ...w, requestCount: w.requestCount + 1 }));
    startMissionSelection();
    log('info', '신규 승객 호출 · 키오스크 K-02 가상 요청');
  };

  const onReturnCharge = () => {
    setWorld((w) => {
      return returnToCharge(w, selected).world;
    });
  };

  const resetSim = () => {
    setWorld(createWorld());
    setEstop(false);
    setPaused(false);
    setObstacle(false);
    setSelected('SW-01');
    setMissionDraft(null);
    log('info', '가상 역사 시뮬레이션 초기화');
  };

  const toggleLayer = (key) => setLayers((l) => ({ ...l, [key]: !l[key] }));
  const slam = estop ? 0 : Math.max(86, 99.4 - (active.avoiding ? 4.2 : 0) - (active.nearestDist < 1 ? 3 : 0));
  const lidarLabel = active.nearestDist < 8 ? `${active.nearestDist.toFixed(1)}m` : '—';
  const missionStartLabel = !missionDraft?.start
    ? '맵에서 출발지를 선택하세요'
    : `${missionDraft.start.floor} (${missionDraft.start.x.toFixed(1)}, ${missionDraft.start.z.toFixed(1)})`;
  const missionDestinationLabel = !missionDraft?.destination
    ? '맵에서 도착지를 선택하세요'
    : `${missionDraft.destination.floor} (${missionDraft.destination.x.toFixed(1)}, ${missionDraft.destination.z.toFixed(1)})`;

  return (
    <main className="app">
      <div className="scene">
        <StationScene
          robots={robots}
          pedestrians={world.pedestrians}
          extras={world.extras}
          selected={selected}
          onSelect={selectRobot}
          onMapPoint={selectMapPoint}
          missionDraft={missionDraft}
          selectionFloor={missionDraft?.selectionFloor}
          plannedPath={plannedPath}
          layers={layers}
        />
      </div>

      <header className="topbar glass">
        <div className="brand">
          <div className="brandmark"><Navigation size={23} /></div>
          <div>
            <div className="brandname">SUSEO <span>MOBILITY TWIN</span></div>
            <div className="subbrand">VIRTUAL STATION SIM · WHEELCHAIR FLEET</div>
          </div>
        </div>
        <div className="live">
          <span className="pulse" /> LIVE SIMULATION <span className="separator">/</span> {clock}
        </div>
        <div className="topright">
          <span className="connection"><Signal size={17} /> 시뮬 링크 · 실하드웨어 없음</span>
          <button className="iconbtn" onClick={() => log('info', '시뮬 이벤트 큐 확인')}><Bell size={19} /><i /></button>
          <div className="operator">
            <div className="avatar">관</div>
            <div><b>통합 관제센터</b><small>DEMO OPERATOR</small></div>
          </div>
        </div>
      </header>

      <section className="kpis">
        <div className="kpi glass">
          <div className="kpi-icon teal"><Bot size={20} /></div>
          <div>
            <small>운영 로봇</small>
            <strong>{online}<em> 대</em></strong>
            <span className="positive">● 시뮬 에이전트 온라인</span>
          </div>
        </div>
        <div className="kpi glass">
          <div className="kpi-icon blue"><Activity size={20} /></div>
          <div>
            <small>평균 배터리</small>
            <strong>{avgBattery}<em>%</em></strong>
            <div className="mini-bar"><i style={{ width: `${avgBattery}%` }} /></div>
          </div>
        </div>
        <div className="kpi glass">
          <div className="kpi-icon violet"><Route size={20} /></div>
          <div>
            <small>운행 · 회피</small>
            <strong>{missions}<em> 대</em></strong>
            <span className="muted">평균 {avgSpeed.toFixed(2)} m/s</span>
          </div>
        </div>
        <div className="kpi glass">
          <div className="kpi-icon amber"><UserRound size={20} /></div>
          <div>
            <small>보행자 · 호출</small>
            <strong>{world.pedestrians.length}<em> / {world.requestCount}</em></strong>
            <span className={congestion > 70 ? 'warntext' : 'positive'}>복도 혼잡 {congestion}%</span>
          </div>
        </div>
      </section>

      <div className="maplabel">
        <span className="mapdot" />
        <div>
          <b>VIRTUAL SUSEO STATION</b>
          <small>OBJ-INSPIRED MAP · 1F / B1 / B2 LIVE SIMULATION</small>
        </div>
        <span className="maptag">DIGITAL TWIN SIM</span>
      </div>

      <aside className="leftpanel glass">
        <div className="panelhead">
          <div>
            <span className="eyebrow">FLEET MANAGEMENT</span>
            <h2>로봇 플릿 <span className="count">{String(robots.length).padStart(2, '0')}</span></h2>
          </div>
          <button className="tinybtn" onClick={() => startMissionSelection()}>+ 배차</button>
        </div>
        <div className="robotlist">
          {robots.map((r) => (
            <button key={r.id} className={`robotrow ${selected === r.id ? 'selected' : ''}`} onClick={() => selectRobot(r.id)}>
              <div className="robot-icon" style={{ '--robot': r.color }}><Bot size={21} /><span /></div>
              <div className="robot-info">
                <b>{r.id}<span className={`status ${statusTone(r.status)}`}>{r.status}</span></b>
                <small>{r.targetPoint ? `${r.targetPoint.floor} 맵 지정 지점` : nodeLabel(r.target)}</small>
                <div className="batteryline">
                  <div className="battery"><i style={{ width: `${r.battery}%`, background: r.battery < 25 ? '#ffbd69' : r.color }} /></div>
                  <small>{Math.round(r.battery)}%</small>
                </div>
              </div>
              <ChevronDown size={15} className="rowchevron" />
            </button>
          ))}
        </div>
        <button className="actionrow add-robot" onClick={addFleetRobot}>
          <span className="actionicon cyan"><Plus size={18} /></span>
          <span><b>휠체어 추가</b><small>플릿에 새 로봇을 배치합니다</small></span>
          <span className="plus">+</span>
        </button>
        <div className="paneldivider" />
        <div className="sectiontitle"><span>SCENARIO CONTROLS</span><span className="demo-pill">VIRTUAL DEMO</span></div>
        <button className={`actionrow ${obstacle ? 'active' : ''}`} onClick={injectObstacle}>
          <span className="actionicon orange"><CircleAlert size={18} /></span>
          <span>
            <b>{obstacle ? '혼잡·장애물 해제' : '혼잡·장애물 주입'}</b>
            <small>수하물 3개를 1F · B1 · B2에 분산 배치</small>
          </span>
          <span className={`toggle ${obstacle ? 'on' : ''}`} />
        </button>
        <button className={`actionrow ${estop ? 'dangerrow' : ''}`} onClick={triggerEStop}>
          <span className="actionicon red"><Siren size={18} /></span>
          <span>
            <b>{estop ? '비상 정지 해제' : '비상 정지 (E-STOP)'}</b>
            <small>{estop ? '시뮬 전체 정지' : '모든 휠체어 즉시 정지'}</small>
          </span>
          <span className={`toggle ${estop ? 'on redtoggle' : ''}`} />
        </button>
        <button className="actionrow" onClick={passengerCall}>
          <span className="actionicon cyan"><UserRound size={18} /></span>
          <span><b>신규 승객 호출</b><small>가상 키오스크 요청 생성</small></span>
          <span className="plus">+</span>
        </button>
        <div className="paneldivider" />
        <div className="switchrow">
          <span><b>자동 충전 복귀</b><small>공차 · 배터리 20% 미만</small></span>
          <button className={`toggle ${autoReturn ? 'on' : ''}`} onClick={() => setAutoReturn((v) => !v)} />
        </div>
      </aside>

      <aside className="rightpanel glass">
        <div className="panelhead">
          <div>
            <span className="eyebrow">LIVE TELEMETRY</span>
            <h2>{active.id} <span className="livebadge"><i /> SIM</span></h2>
          </div>
          <span className="robot-tag">{active.status}</span>
        </div>
        <div className="batteryhero">
          <div className="battery-ring" style={{ '--pct': `${active.battery * 3.6}deg` }}>
            <BatteryCharging size={25} />
            <b>{Math.round(active.battery)}<small>%</small></b>
          </div>
          <div>
            <span className="eyebrow">BATTERY LEVEL</span>
            <h3>{active.battery < 20 ? '충전 필요' : active.battery < 45 ? '충전 권장' : '정상 작동'}</h3>
            <small>시뮬 잔여 운행 {Math.round(active.battery * 0.42)}분</small>
          </div>
        </div>
        <div className="telemetrygrid">
          <div>
            <small><Gauge size={14} /> 주행 속도</small>
            <b>{estop ? '0.00' : active.speed.toFixed(2)} <em>m/s</em></b>
          </div>
          <div>
            <small><Crosshair size={14} /> 위치 추정</small>
            <b className="green">{estop ? 'HOLD' : '시뮬'} <em>{slam.toFixed(1)}%</em></b>
          </div>
          <div>
            <small><Cpu size={14} /> 회피 상태</small>
            <b>{active.avoiding ? '회피 조향' : '추종'} <em>{active.avoiding ? 'LOCAL' : 'PATH'}</em></b>
          </div>
          <div>
            <small><Radio size={14} /> 최근접 장애물</small>
            <b>{active.nearestDist < 1.2 ? '근접' : '주변 여유'} <em>{lidarLabel}</em></b>
          </div>
        </div>
        <div className="routebox">
          <div className="routehead">
            <b><Route size={15} /> 할당 경로</b>
            <span>{active.missionPath?.length || active.route?.length || 1} WAYPOINTS · A*</span>
          </div>
          {active.missionPath?.length ? (
            <div className="direct-route">
              <span>{active.originPoint?.floor || active.floor} 출발</span>
              <i />
              <span>장애물 인지 최단경로</span>
              <i />
              <span>{active.targetPoint?.floor || active.floor} 도착</span>
            </div>
          ) : (
            <div className="routepath">
              {(active.route || []).map((id, i) => (
                <React.Fragment key={id + i}>
                  <span className={i <= (active.routeIndex || 0) ? 'passed' : ''}>{nodeLabel(id)}</span>
                  {i < active.route.length - 1 && <i />}
                </React.Fragment>
              ))}
            </div>
          )}
          <div className="routefoot">
            <span><MapPin size={13} /> {active.targetPoint ? `${active.targetPoint.floor} 맵 지점` : nodeLabel(active.target)}</span>
            <span><Clock3 size={13} /> ETA {formatEta(etaSeconds(active))}</span>
          </div>
        </div>
        <div className="diagnostics">
          <div className="sectiontitle">
            <span>SIM DIAGNOSTICS</span>
            <span className="normaltext">● {active.status === '보행자 대기' ? 'HOLD FOR PEDESTRIAN' : active.avoiding ? 'AVOIDING' : 'NOMINAL'}</span>
          </div>
          <div className="diagline"><span className="diagcheck">✓</span><span>혼잡 비용 A* 전역 경로</span><b>{world.metrics.replans} 재계획</b></div>
          <div className="diagline"><span className="diagcheck">✓</span><span>보행자·로봇 로컬 포텐셜 회피</span><b>{world.metrics.nearMisses} 근접</b></div>
          <div className="diagline">
            <span className={`diagcheck ${obstacle || active.nearestDist < 1.1 ? 'warncheck' : ''}`}>{obstacle || active.nearestDist < 1.1 ? '!' : '✓'}</span>
            <span>{obstacle ? '시나리오 장애물 활성' : '동적 장애물 감시'}</span>
            <b>{obstacle ? 'CROWD' : 'READY'}</b>
          </div>
        </div>
        <div className="robotactions">
          <button className="secondarybtn" onClick={onReturnCharge}><BatteryCharging size={15} /> 충전 복귀</button>
          <button className="primarybtn" onClick={() => startMissionSelection(active.id)}><Navigation size={15} /> 미션 할당</button>
        </div>
      </aside>

      <div className="bottomleft glass">
        <div className="bottomtitle">
          <span><Activity size={15} /> LIVE EVENT STREAM</span>
          <span className="eventcount">{events.length} EVENTS</span>
        </div>
        <div className="eventlist">
          {events.slice(0, 4).map((e) => (
            <div className="event" key={e.id}>
              <span className={`eventdot ${e.type}`} />
              <small>{e.time}</small>
              <span>{e.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bottomright glass">
        <div className="minihead"><span>MAP LAYERS</span><span className="layerlive">● SIM</span></div>
        {[
          ['path', 'layerpath', '글로벌 경로'],
          ['lidar', 'layerlidar', 'LiDAR 스캔'],
          ['crowd', 'layercrowd', '보행자 흐름'],
          ['geofence', 'layergeo', '금지 구역'],
        ].map(([key, cls, label]) => (
          <button key={key} className={`layerrow ${layers[key] ? '' : 'off'}`} onClick={() => toggleLayer(key)}>
            <i className={cls} /> {label} <span>{layers[key] ? 'ON' : 'OFF'}</span>
          </button>
        ))}
        <div className="mapcoords">도착 {world.metrics.arrivals} · 근접회피 {world.metrics.nearMisses}</div>
      </div>

      <footer className="footer">
        <span>© SUSEO MOBILITY DIGITAL TWIN</span>
        <span><i /> SIMULATION MODE · HARDWARE NOT CONNECTED</span>
        <div className="playcontrols">
          <button onClick={() => setPaused((v) => !v)}>{paused ? <Play size={14} /> : <Pause size={14} />} {paused ? '재개' : '일시정지'}</button>
          <button onClick={resetSim}>초기화</button>
        </div>
      </footer>

      {missionDraft && (
        <section className="missionbar glass">
          <div className="missionbar-head">
            <span className="eyebrow">MAP MISSION PLANNER</span>
            <button className="mission-cancel" onClick={() => setMissionDraft(null)} aria-label="미션 선택 취소">×</button>
          </div>
          <b>{draftRobot?.id || '휠체어 선택'} <span>·</span> {missionStartLabel}</b>
          <small className="mission-step">{missionDestinationLabel}</small>
          <div className="mission-map-edit">
            <div className="mission-map-floors" aria-label="지점 선택 층">
              {['1F', 'B1', 'B2'].map((floor) => (
                <button
                  key={floor}
                  className={missionDraft.selectionFloor === floor ? 'active' : ''}
                  onClick={() => selectMissionFloor(floor)}
                  aria-pressed={missionDraft.selectionFloor === floor}
                >
                  {floor}
                </button>
              ))}
            </div>
            <div className="mission-point-edit">
              <button
                className={missionDraft.selecting === 'start' ? 'active' : ''}
                onClick={() => editMissionPoint('start')}
              >
                출발지 다시 선택
              </button>
              <button
                className={missionDraft.selecting === 'destination' ? 'active' : ''}
                onClick={() => editMissionPoint('destination')}
                disabled={!missionDraft.start}
              >
                도착지 다시 선택
              </button>
            </div>
          </div>
          <small className="mission-selection-hint">
            {missionDraft.selecting
              ? `${missionDraft.selectionFloor} 층에서 ${missionDraft.selecting === 'start' ? '출발지' : '도착지'}를 지도에서 선택하세요.`
              : '맵 이동 중 오클릭을 방지하려면 위의 다시 선택 버튼을 누르세요.'}
          </small>
          {missionDraft.start && missionDraft.destination ? (
            <>
              <small>좌표 기반 경로 · {plannedPath.length}개 경로점 · 장애물 회피 및 엘리베이터 연결 반영</small>
              <small>휠체어는 현재 위치에서 지정한 출발 좌표를 거쳐 도착 좌표로 이동합니다.</small>
            </>
          ) : (
            <small>층을 먼저 선택한 뒤 지도에서 출발 좌표와 도착 좌표를 지정하세요.</small>
          )}
          {missionDraft.start && missionDraft.destination && (
            <div className="missionbar-routes">
              <span><i className="route-swatch planned" /> 최적 경로</span>
              <span><i className="route-swatch realtime" /> 실시간 수정 경로</span>
            </div>
          )}
          <div className="missionbar-actions">
            <button className="secondarybtn" onClick={() => setMissionDraft(null)}>취소</button>
            <button className="primarybtn" disabled={!missionDraft.start || !missionDraft.destination} onClick={dispatch}>
              <Navigation size={14} /> 배차 확정
            </button>
          </div>
        </section>
      )}

      {estop && (
        <div className="estopbanner">
          <ShieldAlert size={18} /> EMERGENCY STOP ACTIVE <span>시뮬레이터 전체 로봇 정지</span>
        </div>
      )}
    </main>
  );
}
