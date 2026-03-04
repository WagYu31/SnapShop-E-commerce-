import React from 'react';

interface Props {
    lat: number;
    lng: number;
    mapRef: React.RefObject<any>;
    onRegionChangeComplete?: (region: any) => void;
}

declare const MapComponent: React.FC<Props>;
export default MapComponent;

export declare function moveMap(
    mapRef: React.RefObject<any>,
    lat: number,
    lng: number,
    boundingbox?: string[]
): void;
