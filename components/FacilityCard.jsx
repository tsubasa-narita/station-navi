import React from 'react';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { getCarLabel } from './carLabel';

export default function FacilityCard({ facility, activeMeta, activeTrainLength, lineName }) {
    const carLabel = getCarLabel(facility.carNumber, lineName, activeTrainLength);
    // 🌟UX改善：この設備が他の両数でも全く同じ号車になるか判定
    const isAlwaysSamePosition = facility.positions && facility.positions.length > 1 &&
        facility.positions.every(p => p.carNumber === facility.carNumber && p.doorNumber === facility.doorNumber);

    return (
        <div key={`${facility.id}-${activeTrainLength}`} className={`animate-pop-in bg-white rounded-3xl overflow-hidden shadow-sm border-2 border-${activeMeta.themeColor}-100 relative`}>

            {/* 他の両数でも同じ号車になる場合のバッジ表示 */}
            {isAlwaysSamePosition && (
                <div className={`bg-${activeMeta.themeColor}-100 text-${activeMeta.themeColor}-800 text-xs font-bold text-center py-1.5 border-b border-${activeMeta.themeColor}-200`}>
                    💡 電車の長さが変わっても、乗車位置は変わりません
                </div>
            )}

            {/* 行き先ヘッダー */}
            <div className={`bg-${activeMeta.themeColor}-50 px-5 py-3 border-b border-${activeMeta.themeColor}-100 flex items-center justify-between`}>
                <div className="flex items-center gap-2 font-bold text-gray-800">
                    <span>{facility.floorFrom}</span>
                    <ArrowRight size={16} className={`text-${activeMeta.themeColor}-400`} />
                    <span className={`text-${activeMeta.themeColor}-800`}>{facility.floorTo} 行き</span>
                </div>
                {facility.direction && (
                    <span className={`text-xs font-bold bg-white text-${activeMeta.themeColor}-600 px-2.5 py-1 rounded-full border border-${activeMeta.themeColor}-200`}>
                        {facility.direction}
                    </span>
                )}
            </div>

            {/* 超巨大な号車・ドア表示 */}
            <div className="p-6 text-center">
                <div className="flex items-baseline justify-center gap-2">
                    <span className={`text-6xl font-black text-${activeMeta.themeColor}-600 tracking-tighter`}>{carLabel}</span>
                    <span className="text-xl font-bold text-gray-500 pb-1">号車</span>

                    <span className="w-4"></span> {/* 余白 */}

                    <span className={`text-6xl font-black text-${activeMeta.themeColor}-600 tracking-tighter`}>{facility.doorNumber}</span>
                    <span className="text-xl font-bold text-gray-500 pb-1">番ドア</span>
                </div>
                <p className="text-sm text-gray-400 font-medium mt-2">付近に乗車してください</p>
            </div>

            {/* 備考 */}
            {facility.notes && (
                <div className={`mx-4 mb-4 bg-${activeMeta.themeColor}-50/50 p-3 rounded-xl border border-${activeMeta.themeColor}-100 flex items-start gap-2`}>
                    <AlertCircle size={18} className={`mt-0.5 flex-shrink-0 text-${activeMeta.themeColor}-500`} />
                    <p className="text-sm font-medium text-gray-600 leading-snug">{facility.notes}</p>
                </div>
            )}
        </div>
    );
}
