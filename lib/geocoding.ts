export interface GeocodedAddress {
    address: string;
    city: string;
}

interface NominatimAddress {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    village?: string;
    town?: string;
    city?: string;
    municipality?: string;
    state?: string;
}

interface NominatimReverseResponse {
    address?: NominatimAddress;
}

export async function reverseGeocode(
    latitude: number,
    longitude: number,
): Promise<GeocodedAddress | null> {
    try {
        const query = new URLSearchParams({
            format: "jsonv2",
            lat: latitude.toString(),
            lon: longitude.toString(),
            zoom: "18",
            addressdetails: "1",
        });
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?${query.toString()}`,
            { headers: { Accept: "application/json" } },
        );

        if (!response.ok) return null;

        const data = (await response.json()) as NominatimReverseResponse;
        if (!data.address) return null;

        const city =
            data.address.city ||
            data.address.town ||
            data.address.village ||
            data.address.municipality ||
            data.address.state;
        if (!city) return null;

        const road = [data.address.house_number, data.address.road]
            .filter(Boolean)
            .join(" ");
        const localName =
            road ||
            data.address.neighbourhood ||
            data.address.suburb ||
            data.address.village;
        const address = localName && localName !== city
            ? `${localName}, ${city}`
            : city;

        return { address, city };
    } catch {
        return null;
    }
}