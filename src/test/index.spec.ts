import { expect } from "chai";
import "mocha";
import nock, { Scope } from "nock";
import { default as esriSampleResData } from "./esri-sample.json";
import { default as resultSampleResData } from "./result-sample.json";
import { default as esriSampleResDataZeroIdLayer } from "./esri-sample-0-id-layer.json";
import { default as resultSampleResDataZeroIdLayer } from "./result-sample-0-id-layer.json";
import { default as esriSampleResDataCollection } from "./esri-sample-collection.json";
import { default as resultSampleResDataCollection } from "./result-sample-collection.json";
import myFunction from "../index";

describe("Test Function", () => {
    let esriApiScope: Scope;
    const esriApiUrl = "http://example.com";

    after(() => {
        nock.cleanAll();
        nock.enableNetConnect();
    });

    before(() => {
        nock.disableNetConnect();
        // Allow localhost connections so we can test local routes and mock servers.
        nock.enableNetConnect("127.0.0.1");

        esriApiScope = nock(esriApiUrl).persist();

        esriApiScope
            .get("/*")
            .query(query => {
                return query?.f !== "json";
            })
            .reply(200, "This is a html page of the API.");

        esriApiScope
            .get("/esri-sample")
            .query(query => {
                return query?.f === "json";
            })
            .reply(200, esriSampleResData);

        esriApiScope
            .get("/esri-sample-0-id-layer")
            .query(query => {
                return query?.f === "json";
            })
            .reply(200, esriSampleResDataZeroIdLayer);

        esriApiScope
            .get("/esri-sample-collection")
            .query(query => {
                return query?.f === "json";
            })
            .reply(200, esriSampleResDataCollection);
    });

    it("should extract correct metadata for url WITH ?f=json", async () => {
        const result = await myFunction(
            "http://example.com/esri-sample?f=json"
        );
        expect(result).to.deep.equal(resultSampleResData);
    });

    it("should extract correct metadata for url WITHOUT ?f=json", async () => {
        const result = await myFunction("http://example.com/esri-sample");
        expect(result).to.deep.equal(resultSampleResData);
    });

    it("should extract correct metadata for `ZERO id Layer` url WITH ?f=json", async () => {
        const result = await myFunction(
            "http://example.com/esri-sample-0-id-layer?f=json"
        );
        expect(result).to.deep.equal(resultSampleResDataZeroIdLayer);
    });

    it("should extract correct metadata for `ZERO id Layer` url WITHOUT ?f=json", async () => {
        const result = await myFunction(
            "http://example.com/esri-sample-0-id-layer"
        );
        expect(result).to.deep.equal(resultSampleResDataZeroIdLayer);
    });

    it("should extract correct metadata for `Collection` url WITH ?f=json", async () => {
        const result = await myFunction(
            "http://example.com/esri-sample-collection?f=json"
        );
        expect(result).to.deep.equal(resultSampleResDataCollection);
    });

    it("should extract correct metadata for `Collection` url WITHOUT ?f=json", async () => {
        const result = await myFunction(
            "http://example.com/esri-sample-collection"
        );
        expect(result).to.deep.equal(resultSampleResDataCollection);
    });
});
