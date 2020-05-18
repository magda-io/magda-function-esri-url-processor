import coordinate2WGS84, {
    SpatialReference,
    CoordinateType
} from "./coordinate2WGS84";

// -- in order minlon (west), minlat (south), maxlon (east), maxlat (north)
export type ExtentType = number[];

/**
 * Transform extent to WGS84 coordinates system
 *
 * @param {ExtentType} extent input extent
 * @param {SpatialReference} sr input/from coordinates system SpatialReference
 * @param {number} [opt_stops=1] opt_stops Number of stops per side used for the transform. By default only the corners are used.
 * @returns {Promise<ExtentType>} result extent
 */
async function extent2WGS84(
    extent: ExtentType,
    sr: SpatialReference,
    opt_stops: number = 1
): Promise<ExtentType> {
    if (!extent || extent.length !== 4) {
        throw new Error("Invalid input Extent data.");
    }

    let coordinates: CoordinateType[] = [];
    if (opt_stops > 1) {
        const width = extent[2] - extent[0];
        const height = extent[3] - extent[1];
        for (let i = 0; i < opt_stops; ++i) {
            const coords = [
                [extent[0] + (width * i) / opt_stops, extent[1]],
                [extent[2], extent[1] + (height * i) / opt_stops],
                [extent[2] - (width * i) / opt_stops, extent[3]],
                [extent[0], extent[3] - (height * i) / opt_stops]
            ];
            coordinates = coordinates.concat(coords);
        }
    } else {
        coordinates = [
            [extent[0], extent[1]],
            [extent[2], extent[1]],
            [extent[2], extent[3]],
            [extent[0], extent[3]]
        ];
    }

    coordinates = await coordinate2WGS84(coordinates, sr);

    const xs: number[] = [];
    const ys: number[] = [];

    coordinates.forEach(coord => {
        xs.push(coord[0]);
        ys.push(coord[1]);
    });

    return [
        Math.min.apply(null, xs),
        Math.min.apply(null, ys),
        Math.max.apply(null, xs),
        Math.max.apply(null, ys)
    ];
}

export default extent2WGS84;
