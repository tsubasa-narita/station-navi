import React, { useState, useEffect } from 'react';
import { MapPin, Info, ArrowRight, AlertCircle, CheckCircle2, Train, Map, Star } from 'lucide-react';

// --- 分離したコンポーネントとデータ ---
import { ElevatorIcon, EscalatorIcon, StairsIcon } from './components/Icons';
import FacilityCard from './components/FacilityCard';
import TrainDiagram from './components/TrainDiagram';
import stationData from './stationData.json';

const FAVORITES_KEY = 'station-navi-favorites';
const MAX_FAVORITES = 5;

function loadFavorites() {
    try {
        return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    } catch { return []; }
}

export default function App() {
    const [favorites, setFavorites] = useState(loadFavorites);

    useEffect(() => {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }, [favorites]);

    const isFavorite = (line, stationId) => favorites.some(f => f.line === line && f.stationId === stationId);

    const toggleFavorite = () => {
        if (isFavorite(selectedLine, safeStationId)) {
            setFavorites(prev => prev.filter(f => !(f.line === selectedLine && f.stationId === safeStationId)));
        } else {
            if (favorites.length >= MAX_FAVORITES) {
                alert('お気に入りは最大5件までです。先に削除してください。');
                return;
            }
            const station = stationData.find(s => s.stationId === safeStationId);
            setFavorites(prev => [...prev, { line: selectedLine, stationId: safeStationId, stationName: station?.stationName || '' }]);
        }
    };

    const selectFavorite = (fav) => {
        setSelectedLine(fav.line);
        const station = stationData.find(s => s.stationId === fav.stationId);
        if (station) {
            setSelectedStationId(fav.stationId);
            setSelectedPlatformId(station.platforms[0].platformId);
            setSelectedTrainLength(station.platforms[0].availableTrainLengths[0]);
        }
    };

    const availableLines = [...new Set(stationData.map(d => d.line))];
    const [selectedLine, setSelectedLine] = useState(availableLines[0]);

    const stationsInLine = stationData.filter(d => d.line === selectedLine);
    const [selectedStationId, setSelectedStationId] = useState(stationsInLine[0].stationId);

    const safeStationId = stationsInLine.find(s => s.stationId === selectedStationId)
        ? selectedStationId : stationsInLine[0].stationId;

    const currentStation = stationData.find(s => s.stationId === safeStationId) || stationData[0];
    const [selectedPlatformId, setSelectedPlatformId] = useState(currentStation.platforms[0].platformId);
    const currentPlatform = currentStation.platforms.find(p => p.platformId === selectedPlatformId) || currentStation.platforms[0];

    const [selectedTrainLength, setSelectedTrainLength] = useState(currentPlatform.availableTrainLengths[0]);

    const [targetFacilityType, setTargetFacilityType] = useState('elevator');

    const availableLengths = currentPlatform.availableTrainLengths;
    const activeTrainLength = availableLengths.includes(selectedTrainLength) ? selectedTrainLength : availableLengths[0];

    const targetFacilities = currentPlatform.facilities
        .filter(f => f.type === targetFacilityType)
        .map(f => {
            const targetPosition = f.positions.find(p => p.length === activeTrainLength);
            if (!targetPosition) return null;
            return { ...f, carNumber: targetPosition.carNumber, doorNumber: targetPosition.doorNumber };
        })
        .filter(Boolean)
        .sort((a, b) => {
            if (a.carNumber !== b.carNumber) return a.carNumber - b.carNumber;
            return a.doorNumber - b.doorNumber;
        });

    const getFacilityMeta = (type) => {
        switch (type) {
            case 'elevator': return { icon: ElevatorIcon, label: 'エレベーター', themeColor: 'blue' };
            case 'escalator': return { icon: EscalatorIcon, label: 'エスカレーター', themeColor: 'green' };
            case 'stairs': return { icon: StairsIcon, label: '階段', themeColor: 'orange' };
            default: return { icon: Info, label: 'その他', themeColor: 'gray' };
        }
    };

    const activeMeta = getFacilityMeta(targetFacilityType);

    const allFacilitiesForDiagram = currentPlatform.facilities
        .map(f => {
            const pos = f.positions.find(p => p.length === activeTrainLength);
            if (!pos) return null;
            return { ...f, carNumber: pos.carNumber, doorNumber: pos.doorNumber };
        })
        .filter(Boolean);

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-20 overflow-x-hidden">
            {/* 🌟UX改善：カードが切り替わったことを伝えるアニメーションを追加 */}
            <style>{`
        @keyframes popIn {
          0% { opacity: 0; transform: translateY(8px) scale(0.99); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-pop-in {
          animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-2">
                    <MapPin className="text-blue-600" size={24} />
                    <h1 className="text-xl font-bold tracking-tight">降車位置ガイド</h1>
                </div>
            </header>

            {favorites.length > 0 && (
                <div className="max-w-md mx-auto px-4 mt-3">
                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                        {favorites.map(fav => {
                            const isActive = fav.line === selectedLine && fav.stationId === safeStationId;
                            return (
                                <button
                                    key={fav.stationId}
                                    onClick={() => selectFavorite(fav)}
                                    className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${isActive
                                        ? 'bg-yellow-50 border-yellow-400 text-yellow-700'
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                                >
                                    <Star size={12} className={isActive ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                                    {fav.stationName}駅
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <main className="max-w-md mx-auto px-4 mt-6">

                {/* 1. 路線選択 */}
                <div className="mb-5">
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                        <Map size={18} className="text-gray-500" />
                        1. 乗車する路線
                    </label>
                    <div className="relative">
                        <select
                            value={selectedLine}
                            onChange={(e) => {
                                const newLine = e.target.value;
                                setSelectedLine(newLine);
                                const newStations = stationData.filter(d => d.line === newLine);
                                const firstStation = newStations[0];
                                setSelectedStationId(firstStation.stationId);
                                setSelectedPlatformId(firstStation.platforms[0].platformId);
                                setSelectedTrainLength(firstStation.platforms[0].availableTrainLengths[0]);
                            }}
                            className="w-full appearance-none bg-white border-2 border-gray-200 rounded-xl py-3.5 px-4 text-lg font-bold text-gray-900 shadow-sm focus:outline-none focus:border-blue-500 transition-colors"
                        >
                            {availableLines.map(line => (
                                <option key={line} value={line}>{line}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                            <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                        </div>
                    </div>
                </div>

                {/* 2. 駅選択 */}
                <div className="mb-5">
                    <label className="block text-sm font-bold text-gray-700 mb-2">2. 降りる駅</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <select
                                value={safeStationId}
                                onChange={(e) => {
                                    const newStationId = e.target.value;
                                    const newStation = stationData.find(s => s.stationId === newStationId);
                                    setSelectedStationId(newStationId);
                                    setSelectedPlatformId(newStation.platforms[0].platformId);
                                    setSelectedTrainLength(newStation.platforms[0].availableTrainLengths[0]);
                                }}
                                className="w-full appearance-none bg-white border-2 border-gray-200 rounded-xl py-3.5 px-4 text-lg font-bold text-gray-900 shadow-sm focus:outline-none focus:border-blue-500 transition-colors"
                            >
                                {stationsInLine.map(station => (
                                    <option key={station.stationId} value={station.stationId}>
                                        {station.stationName}駅
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                                <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>
                        <button
                            onClick={toggleFavorite}
                            className={`flex-shrink-0 w-12 h-12 self-center flex items-center justify-center rounded-xl border-2 transition-all ${isFavorite(selectedLine, safeStationId)
                                ? 'bg-yellow-50 border-yellow-400'
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                            title={isFavorite(selectedLine, safeStationId) ? 'お気に入り解除' : 'お気に入り登録'}
                        >
                            <Star
                                size={22}
                                className={isFavorite(selectedLine, safeStationId)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }
                            />
                        </button>
                    </div>
                </div>

                {/* 3. ホーム選択 */}
                <div className="mb-5">
                    <label className="block text-sm font-bold text-gray-700 mb-2">3. 降りるホーム</label>
                    <div className="flex flex-col gap-2">
                        {currentStation.platforms.map(platform => (
                            <button
                                key={platform.platformId}
                                onClick={() => {
                                    setSelectedPlatformId(platform.platformId);
                                    setSelectedTrainLength(platform.availableTrainLengths[0]);
                                }}
                                className={`text-left px-4 py-3.5 rounded-xl text-base font-bold transition-all border-2 ${selectedPlatformId === platform.platformId
                                    ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-sm'
                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPlatformId === platform.platformId ? 'border-blue-500' : 'border-gray-300'}`}>
                                        {selectedPlatformId === platform.platformId && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                                    </div>
                                    {platform.platformName}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 4. 両数選択 */}
                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                        <Train size={18} className="text-gray-500" />
                        4. 電車の両数
                    </label>
                    <div className="flex bg-gray-200 p-1 rounded-xl">
                        {availableLengths.map(length => (
                            <button
                                key={length}
                                onClick={() => setSelectedTrainLength(length)}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTrainLength === length
                                    ? 'bg-white text-gray-900 shadow'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {length}両編成
                            </button>
                        ))}
                    </div>
                </div>

                <hr className="border-gray-200 my-6" />

                {/* 5. 目的の設備を選択 */}
                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">5. 使いたい設備は？</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { id: 'elevator', meta: getFacilityMeta('elevator') },
                            { id: 'escalator', meta: getFacilityMeta('escalator') },
                            { id: 'stairs', meta: getFacilityMeta('stairs') }
                        ].map(facility => {
                            const isSelected = targetFacilityType === facility.id;
                            const Icon = facility.meta.icon;
                            return (
                                <button
                                    key={facility.id}
                                    onClick={() => setTargetFacilityType(facility.id)}
                                    className={`flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all ${isSelected
                                        ? `bg-${facility.meta.themeColor}-50 border-${facility.meta.themeColor}-500 text-${facility.meta.themeColor}-700 shadow-sm`
                                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon className={`w-7 h-7 mb-1 ${isSelected ? `text-${facility.meta.themeColor}-600` : 'text-gray-400'}`} />
                                    <span className="text-xs font-bold">{facility.meta.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 号車図 */}
                {allFacilitiesForDiagram.length > 0 && (
                    <TrainDiagram
                        trainLength={activeTrainLength}
                        facilities={allFacilitiesForDiagram}
                        activeFacilityType={targetFacilityType}
                        getFacilityMeta={getFacilityMeta}
                        platformName={currentPlatform.platformName}
                        lineName={selectedLine}
                    />
                )}

                {/* 結果表示エリア */}
                <div className="mt-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <CheckCircle2 className={`text-${activeMeta.themeColor}-500`} size={22} />
                        乗るべき位置はこちら
                    </h2>

                    <div className="space-y-4">
                        {targetFacilities.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-300">
                                <activeMeta.icon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium leading-relaxed">
                                    このホーム（または選択した両数の電車）には<br />{activeMeta.label}への乗車位置がありません。
                                </p>
                            </div>
                        ) : (
                            targetFacilities.map((facility) => (
                                <FacilityCard
                                    key={`${facility.id}-${activeTrainLength}`}
                                    facility={facility}
                                    activeMeta={activeMeta}
                                    activeTrainLength={activeTrainLength}
                                    lineName={selectedLine}
                                />
                            ))
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
}