import { expect } from "chai";
import "mocha";
import nock, { Scope } from "nock";
import { default as esriSampleResData } from "./esri-sample.json";
import { default as resultSampleResData } from "./result-sample.json";
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
            .get("/")
            .query(query => {
                return query?.f === "json";
            })
            .reply(200, esriSampleResData);

        esriApiScope
            .get("/")
            .query(query => {
                return query?.f !== "json";
            })
            .reply(200, "This is a html page of the API.");
    });

    it("should extract correct metadata for url WITH ?f=json", async () => {
        const result = await myFunction("http://example.com/?f=json");
        expect(result).to.deep.equal(resultSampleResData);
    });

    it("should extract correct metadata for url WITHOUT ?f=json", async () => {
        const result = await myFunction("http://example.com/");
        expect(result).to.deep.equal(resultSampleResData);
    });
});
