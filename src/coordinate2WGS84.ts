import "isomorphic-fetch";
import proj4 from "proj4";

// See https://github.com/Esri/i3s-spec/blob/master/docs/2.0/spatialReference.cmn.md
export type SpatialReference = {
    latestVcsWkid?: number;
    latestWkid?: number;
    vcsWkid?: number;
    wkid?: number;
    wkt?: string;
};

// an array of [x,y]
export type CoordinateType = number[];

/**
 *  Transform a list of coordinates to WGS84 system (EPSG:4326)
 *
 * @param {CoordinateType[]} coordinates a list of coordinates
 * @param {SpatialReference} spatialReference target coordinate spatialReference system
 * @returns {Promise<CoordinateType[]>} The transformed list of coordinates in WGS84 system (EPSG:4326)
 */
async function coordinates2WGS84(
    coordinates: CoordinateType[],
    spatialReference: SpatialReference
): Promise<CoordinateType[]> {
    const srDef = await resolveSpatialReference(spatialReference);
    return coordinates.map(coord => proj4(srDef).inverse(coord));
}

/**
 *
 *
 * @param {SpatialReference} spatialReference
 * @returns {Promise<string>}
 */
async function resolveSpatialReference(
    spatialReference: SpatialReference
): Promise<string> {
    const wktOrPrj4jTxt: string = spatialReference?.wkt;
    if (typeof wktOrPrj4jTxt === "string" && wktOrPrj4jTxt) {
        return wktOrPrj4jTxt;
    }
    const wkid: number = spatialReference?.latestWkid
        ? spatialReference.latestWkid
        : spatialReference?.wkid
        ? spatialReference.wkid
        : spatialReference?.vcsWkid
        ? spatialReference.vcsWkid
        : undefined;

    if (!wkid) {
        throw new Error("Failed to locate Spatial Reference.");
    }
    // --- we use proj4 definition if possible
    const res = await fetch(
        `https://spatialreference.org/ref/epsg/${wkid}/proj4/`
    );
    const bodyText = await res.text();
    if (!res.ok) {
        throw new Error(
            `Failed to resolve Spatial Reference wkid: ${wkid}: ${bodyText}`
        );
    }
    return bodyText;
}

export default coordinates2WGS84;
