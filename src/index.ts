import axios from "axios";
import URI from "urijs";
import isUrl from "is-url";
import { Record } from "@magda/registry-client";

export type UrlProcessorResult = {
    dataset: Record;
    distributions: Record[];
};

const isNumber = (v: any) => typeof v === "number";

function getSpatialCoverageAspect(data: any) {
    if (
        !isNumber(data?.extent?.xmax) ||
        !isNumber(data?.extent?.ymax) ||
        !isNumber(data?.extent?.xmin) ||
        !isNumber(data?.extent?.ymin)
    ) {
        return null;
    }
    return {
        // -- Bounding box in order minlon (west), minlat (south), maxlon (east), maxlat (north)
        bbox: [
            data.extent.xmin,
            data.extent.ymin,
            data.extent.xmax,
            data.extent.ymax
        ],
        spatialDataInputMethod: "bbox"
    };
}

export default async function myFunction(
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
    const res = await axios.get(uri.toString());
    if (res.status !== 200) {
        throw new Error(
            `Failed to retrieve data from url : ${url} Error: ${res.statusText}`
        );
    }

    if (!res?.data?.id || !res?.data?.name) {
        throw new Error(
            `Failed to retrieve data from esri API: ${url} Error: can't locate id or name`
        );
    }

    const data = res.data;
    const spatialCoverageAspect = getSpatialCoverageAspect(data);

    const result: UrlProcessorResult = {
        dataset: {
            id: "",
            name: data.name,
            sourceTag: "",
            tenantId: 0,
            aspects: {
                "dcat-dataset-strings": {
                    title: data.name,
                    description: data?.description
                }
            }
        },
        distributions: [
            {
                id: data.id,
                name: data.name,
                sourceTag: "",
                tenantId: 0,
                aspects: {
                    "dcat-distribution-strings": {
                        title: data.name,
                        description: data?.description,
                        format: "ESRI REST"
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
