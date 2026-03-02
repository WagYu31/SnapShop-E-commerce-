import React from 'react';
import { StyleSheet } from 'react-native';
import MapView from 'react-native-maps';

interface Props {
    lat: number;
    lng: number;
    mapRef: React.RefObject<any>;
}

export default function MapComponent({ lat, lng, mapRef }: Props) {
    return (
        <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }}
            showsUserLocation={false}
            showsCompass={false}
            showsScale={false}
            toolbarEnabled={false}
            zoomControlEnabled={false}
        />
    );
}

export function moveMap(
    mapRef: React.RefObject<any>,
    lat: number,
    lng: number,
    boundingbox?: string[]
) {
    if (mapRef.current) {
        let latDelta = 0.01;
        let lonDelta = 0.01;

        if (boundingbox && boundingbox.length === 4) {
            // Calculate delta from bounding box [south, north, west, east]
            const south = parseFloat(boundingbox[0]);
            const north = parseFloat(boundingbox[1]);
            const west = parseFloat(boundingbox[2]);
            const east = parseFloat(boundingbox[3]);
            latDelta = Math.abs(north - south) * 1.2; // slight padding
            lonDelta = Math.abs(east - west) * 1.2;
        }

        mapRef.current.animateToRegion(
            {
                latitude: lat,
                longitude: lng,
                latitudeDelta: latDelta,
                longitudeDelta: lonDelta,
            },
            1000
        );
    }
}

const styles = StyleSheet.create({
    map: {
        flex: 1,
    },
});
