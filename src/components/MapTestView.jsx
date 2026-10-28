import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Box, Focus, Layers3, LoaderCircle, Minus, Plus, RotateCcw } from 'lucide-react';
import * as THREE from 'three';
import MapTestScene, { stationModels } from './MapTestScene.jsx';
import './map-test.css';

const initialVisibility = Object.fromEntries(stationModels.map((model) => [model.id, model.defaultVisible]));
const MODEL_SCALE = 0.1;
const MODEL_CENTER = { x: 161, z: -96 };
const FLOOR_HEIGHT = { '1F': 7.2, B1: 0, B2: -7.2 };
const BASE_CAMERA_DIRECTION = [62, 82, 98];
const INITIAL_DISTANCE = 170;
const MIN_CAMERA_DISTANCE = 2;
const MAX_CAMERA_DISTANCE = 280;
const MIN_ZOOM = INITIAL_DISTANCE / MAX_CAMERA_DISTANCE;
const MAX_ZOOM = INITIAL_DISTANCE / MIN_CAMERA_DISTANCE;

export default function MapTestView() {
  const [visibleModels, setVisibleModels] = useState(initialVisibility);
  const [loadedModels, setLoadedModels] = useState({});
  const [modelErrors, setModelErrors] = useState([]);
  const [zoomLabel, setZoomLabel] = useState(1);
  const [floorBounds, setFloorBounds] = useState({});
  const controlsRef = useRef(null);
  const visibleCount = useMemo(
    () => stationModels.filter((model) => visibleModels[model.id]).length,
    [visibleModels],
  );
  const loadedCount = useMemo(
    () => stationModels.filter((model) => visibleModels[model.id] && loadedModels[model.id]).length,
    [loadedModels, visibleModels],
  );

  const markLoaded = useCallback((id) => {
    setLoadedModels((loaded) => (loaded[id] ? loaded : { ...loaded, [id]: true }));
  }, []);

  const updateZoom = useCallback((distance) => {
    setZoomLabel(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, INITIAL_DISTANCE / Math.max(distance, MIN_CAMERA_DISTANCE))));
  }, []);

  const updateBounds = useCallback((id, floor, bounds) => {
    setFloorBounds((current) => {
      const currentFloor = current[floor];
      if (
        currentFloor
        && currentFloor.sources[id]
        && currentFloor.sources[id].min.x === bounds.min.x
      ) return current;
      const sources = {
        ...(currentFloor?.sources || {}),
        [id]: { min: bounds.min.clone(), max: bounds.max.clone() },
      };
      const min = new THREE.Vector3(Infinity, Infinity, Infinity);
      const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
      Object.values(sources).forEach((source) => {
        min.min(source.min);
        max.max(source.max);
      });
      return { ...current, [floor]: { min, max, sources } };
    });
  }, []);

  const addError = useCallback((label, message) => {
    setModelErrors((errors) => [...errors.filter((error) => error.label !== label), { label, message }]);
  }, []);

  const setView = (target, distance, direction = BASE_CAMERA_DIRECTION) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const cameraPosition = controls.object.position;
    const viewDirection = new THREE.Vector3(...direction).normalize();
    controls.target.set(target.x, target.y, target.z);
    cameraPosition.copy(controls.target).addScaledVector(viewDirection, distance);
    controls.object.lookAt(controls.target);
    controls.update();
  };

  const resetView = () => {
    setView({ x: 0, y: 0, z: 0 }, INITIAL_DISTANCE);
    setZoomLabel(1);
  };

  const zoomBy = (factor) => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (factor < 1) controls.dollyIn(1 / factor);
    else controls.dollyOut(factor);
    controls.update();
    updateZoom(controls.object.position.distanceTo(controls.target));
  };

  const focusFloor = (floor) => {
    const bounds = floorBounds[floor];
    if (!bounds) {
      setView({ x: 0, y: FLOOR_HEIGHT[floor], z: 0 }, floor === 'B2' ? 78 : 74);
      return;
    }
    const width = (bounds.max.x - bounds.min.x) * MODEL_SCALE;
    const depth = (bounds.max.z - bounds.min.z) * MODEL_SCALE;
    setView({
      x: (bounds.min.x + bounds.max.x) * 0.5 * MODEL_SCALE - MODEL_CENTER.x * MODEL_SCALE,
      y: FLOOR_HEIGHT[floor],
      z: (bounds.min.z + bounds.max.z) * 0.5 * MODEL_SCALE - MODEL_CENTER.z * MODEL_SCALE,
    }, Math.max(14, Math.max(width, depth) * 1.1));
    setZoomLabel(INITIAL_DISTANCE / Math.max(14, Math.max(width, depth) * 1.1));
  };

  const toggleModel = (id) => {
    setVisibleModels((models) => ({ ...models, [id]: !models[id] }));
    setModelErrors((errors) => errors.filter((error) => error.label !== stationModels.find((model) => model.id === id)?.label));
  };

  return (
    <main className="map-test-view">
      <div className="map-test-canvas">
        <MapTestScene
          visibleModels={visibleModels}
          onLoaded={markLoaded}
          onBounds={updateBounds}
          onError={addError}
          controlsRef={controlsRef}
          onZoom={updateZoom}
        />
      </div>
      <header className="map-test-header">
        <a className="map-test-back" href="/" aria-label="시뮬레이션 대시보드로 돌아가기"><ArrowLeft size={17} /> 대시보드</a>
        <div className="map-test-heading">
          <span className="map-test-icon"><Box size={19} /></span>
          <div>
            <b>수서역 3D 맵 검수</b>
            <small>ORIGINAL OBJ · 1F / B1 / B2 STACKED VIEW</small>
          </div>
        </div>
        <div className={`map-test-status ${modelErrors.length ? 'has-error' : ''}`}>
          {modelErrors.length ? <span className="map-error-dot" /> : <LoaderCircle size={14} className={loadedCount < visibleCount ? 'map-spin' : ''} />}
          {modelErrors.length ? `모델 오류 ${modelErrors.length}건` : `${loadedCount}/${visibleCount}개 모델 로드`}
        </div>
      </header>

      <section className="map-test-floorbar" aria-label="층별 보기">
        <span><Layers3 size={15} /> 층별 포커스</span>
        {['전체', '1F', 'B1', 'B2'].map((floor) => (
          <button key={floor} onClick={floor === '전체' ? resetView : () => focusFloor(floor)}>
            {floor}
          </button>
        ))}
        <span className="map-test-hint">휠 확대 · 좌클릭 드래그 이동 · 우클릭 회전</span>
      </section>

      <aside className="map-test-toolbar">
        <div className="map-test-toolbar-title">
          <div><small>MAP INSPECTOR</small><b>표시할 모델</b></div>
          <span>{visibleCount}/{stationModels.length}</span>
        </div>
        <div className="map-test-model-list">
          {stationModels.map((model) => (
            <label key={model.id} className={`map-test-model ${visibleModels[model.id] ? 'visible' : ''} ${modelErrors.some((error) => error.label === model.label) ? 'failed' : ''}`}>
              <input
                type="checkbox"
                checked={visibleModels[model.id]}
                onChange={() => toggleModel(model.id)}
              />
              <span className="map-model-copy">
                <b>{model.label}</b>
                <small>{model.note || `${model.floor} · 원본 재질 적용`}</small>
              </span>
              {loadedModels[model.id] && visibleModels[model.id] && <i className="map-model-loaded" />}
            </label>
          ))}
        </div>
        {modelErrors.length > 0 && (
          <div className="map-test-errors" role="alert">
            {modelErrors.map((error) => <p key={error.label}><b>{error.label}</b>: {error.message}</p>)}
          </div>
        )}
        <div className="map-test-divider" />
        <div className="map-test-zoom">
          <span>확대 <b>{zoomLabel.toFixed(1)}×</b></span>
          <button onClick={() => zoomBy(1 / 1.25)} aria-label="축소"><Minus size={16} /></button>
          <button onClick={() => zoomBy(1.25)} aria-label="확대"><Plus size={16} /></button>
          <button onClick={resetView} aria-label="전체 역사 보기"><Focus size={15} /></button>
        </div>
        <button className="map-test-reset" onClick={resetView}><RotateCcw size={14} /> 전체 모델에 맞춤</button>
      </aside>

      <footer className="map-test-footer">
        <span>지상층·B1·B2는 같은 X-Z 좌표에 배치되고 층 높이만 분리됩니다.</span>
        <span>OBJ 원본의 MTL 재질 및 MATERIALS 텍스처 포함</span>
      </footer>
    </main>
  );
}
