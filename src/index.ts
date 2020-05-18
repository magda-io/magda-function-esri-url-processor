import "isomorphic-fetch";
import URI from "urijs";
import isUrl from "is-url";
import { Record } from "@magda/registry-client";
import extent2WGS84 from "./extent2WGS84";

export type UrlProcessorResult = {
    dataset: Record;
    distributions: Record[];
};

const isNumber = (v: any) => typeof v === "number";

async function getSpatialCoverageAspect(data: any) {
    const extentData = data?.extent
        ? data.extent
        : data?.fullExtent
        ? data.fullExtent
        : data?.initialExtent;
    if (
        !isNumber(extentData?.xmax) ||
        !isNumber(extentData?.ymax) ||
        !isNumber(extentData?.xmin) ||
        !isNumber(extentData?.ymin)
    ) {
        return undefined;
    }

    // -- Bounding box in order minlon (west), minlat (south), maxlon (east), maxlat (north)
    let bbox = [
        extentData.xmin,
        extentData.ymin,
        extentData.xmax,
        extentData.ymax
    ];

    // --- transform the coordinate system
    if (extentData?.spatialReference) {
        bbox = await extent2WGS84(bbox, extentData.spatialReference);
    }

    return {
        bbox,
        spatialDataInputMethod: "bbox"
    };
}

export default async function processEsriApiUrl(
    input: string
): Promise<UrlProcessorResult> {
    if (!isUrl(input)) {
        throw new Error("Expect the input to be an valid URL.");
    }
    const uri = URI(input);
    const query = uri.search(true);
    if (query?.f != "json") {
        uri.search({ ...query, f: "json" });
    }

    const url = uri.toString();
    const res = await fetch(uri.toString());
    if (res.status !== 200) {
        throw new Error(
            `Failed to retrieve data from url : ${url} Error: ${res.statusText}`
        );
    }

    const data = await res.json();

    if (!data?.extent && !data?.fullExtent && !data?.initialExtent) {
        throw new Error(
            `Failed to locate any extent data from esri API: ${url}`
        );
    }

    const spatialCoverageAspect = await getSpatialCoverageAspect(data);
    const name = data?.name ? data.name : "";
    const description = data?.description
        ? data.description
        : data?.serviceDescription
        ? data.serviceDescription
        : "";

    const result: UrlProcessorResult = {
        dataset: {
            id: "",
            name,
            sourceTag: "",
            tenantId: 0,
            aspects: {
                "dcat-dataset-strings": {
                    title: name,
                    description: description
                },
                source: {
                    id: "esri-url-processor",
                    type: "external",
                    url: uri.toString()
                }
            }
        },
        distributions: [
            {
                id: "",
                name,
                sourceTag: "",
                tenantId: 0,
                aspects: {
                    "dcat-distribution-strings": {
                        title: name,
                        description: description,
                        format: "ESRI REST"
                    },
                    source: {
                        id: "esri-url-processor",
                        type: "external",
                        url: uri.toString()
                    }
                }
            }
        ]
    };

    if (spatialCoverageAspect) {
        result.dataset.aspects["spatial-coverage"] = spatialCoverageAspect;
        result.distributions[0].aspects[
            "spatial-coverage"
        ] = spatialCoverageAspect;
    }

    return result;
}
