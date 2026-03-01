import React from 'react';
import { getCarLabel, isAugmentedLine } from './carLabel';

export default function TrainDiagram({ trainLength, facilities, activeFacilityType, getFacilityMeta, platformName, lineName }) {
    // Collect all car numbers that actually appear in the data
    const carNumSet = new Set();
    for (const f of facilities) {
        carNumSet.add(f.carNumber);
    }

    // Build the full car list: 1..trainLength
    // But also include any car numbers beyond trainLength that appear in data
    const maxCar = Math.max(trainLength, ...carNumSet);
    const cars = Array.from({ length: maxCar }, (_, i) => i + 1);

    // Group facilities by car number
    const facilityByCar = {};
    for (const f of facilities) {
        if (!facilityByCar[f.carNumber]) facilityByCar[f.carNumber] = [];
        facilityByCar[f.carNumber].push(f);
    }

    // Check if this line has augmented cars
    const baseCars = isAugmentedLine(lineName, trainLength);

    const typeSymbol = (type) => {
        switch (type) {
            case 'elevator': return 'EV';
            case 'escalator': return 'ES';
            case 'stairs': return '階';
            default: return '?';
        }
    };

    const typeColor = (type, isActive) => {
        if (!isActive) return 'bg-gray-100 text-gray-400 border-gray-200';
        switch (type) {
            case 'elevator': return 'bg-blue-100 text-blue-700 border-blue-300';
            case 'escalator': return 'bg-green-100 text-green-700 border-green-300';
            case 'stairs': return 'bg-orange-100 text-orange-700 border-orange-300';
            default: return 'bg-gray-100 text-gray-500 border-gray-200';
        }
    };

    const firstLabel = getCarLabel(1, lineName, trainLength);
    const lastLabel = getCarLabel(maxCar, lineName, trainLength);

    return (
        <div className="mt-6 mb-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">ホーム設備マップ</label>
            <div className="bg-white rounded-xl border-2 border-gray-200 p-2 overflow-x-auto">
                {/* Direction arrow */}
                <div className="flex items-center mb-1.5 text-[10px] text-gray-500 font-bold gap-0.5">
                    <span className="whitespace-nowrap">{firstLabel}</span>
                    <div className="flex-1 relative h-3 flex items-center">
                        <div className="absolute inset-x-0 border-t border-gray-300 border-dashed" />
                        <svg className="absolute left-0 -ml-0.5" width="6" height="6" viewBox="0 0 8 8"><path d="M8 4L0 0v8z" fill="#9ca3af" transform="rotate(180 4 4)" /></svg>
                    </div>
                    <span className="whitespace-nowrap text-gray-600">進行方向→</span>
                    <div className="flex-1 relative h-3 flex items-center">
                        <div className="absolute inset-x-0 border-t border-gray-300 border-dashed" />
                        <svg className="absolute right-0 -mr-0.5" width="6" height="6" viewBox="0 0 8 8"><path d="M0 4l8-4v8z" fill="#9ca3af" /></svg>
                    </div>
                    <span className="whitespace-nowrap">{lastLabel}</span>
                </div>
                <div className="flex gap-px">
                    {cars.map(carNum => {
                        const carFacilities = facilityByCar[carNum] || [];
                        const hasFacility = carFacilities.length > 0;
                        const label = getCarLabel(carNum, lineName, trainLength);
                        const isAugmented = baseCars && carNum > baseCars;
                        return (
                            <div key={carNum} className="flex flex-col items-center flex-1 min-w-0">
                                {/* Car box */}
                                <div className={`w-full h-8 border rounded flex items-center justify-center font-bold ${
                                    isAugmented
                                        ? `text-[9px] ${hasFacility ? 'bg-amber-50 border-amber-300' : 'bg-amber-50 border-amber-200 text-amber-400'}`
                                        : `text-[10px] ${hasFacility ? 'bg-gray-50 border-gray-300' : 'bg-gray-50 border-gray-200 text-gray-400'}`
                                }`}>
                                    {label}
                                </div>
                                {/* Facility badges below */}
                                <div className="flex flex-col gap-px mt-0.5 min-h-[18px]">
                                    {carFacilities.map((f, idx) => {
                                        const isActive = f.type === activeFacilityType;
                                        return (
                                            <div
                                                key={idx}
                                                className={`px-0.5 rounded text-[8px] font-bold border text-center leading-4 ${typeColor(f.type, isActive)}`}
                                            >
                                                {typeSymbol(f.type)}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-2 pt-2 border-t border-gray-100 justify-center">
                    {['elevator', 'escalator', 'stairs'].map(type => {
                        const meta = getFacilityMeta(type);
                        const isActive = type === activeFacilityType;
                        return (
                            <div key={type} className={`flex items-center gap-1 text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                                <span className={`inline-block w-4 h-4 rounded border text-center leading-4 ${typeColor(type, true)}`}>
                                    {typeSymbol(type)}
                                </span>
                                {meta.label}
                            </div>
                        );
                    })}
                    {baseCars && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
                            <span className="inline-block w-4 h-4 rounded border border-amber-300 bg-amber-50 text-center leading-4">増</span>
                            増結車両
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
