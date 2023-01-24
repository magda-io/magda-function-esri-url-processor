# magda-function-esri-url-processor

This is Magda ESRI URL processor (a serverless function) created from [this template repo](https://github.com/magda-io/magda-function-template)

The url processor is used by dataset metadata creation tool to extract metadata from a ESRI API URL.

Requirement can be found [here](https://github.com/magda-io/magda/issues/2810)

### Function Spec

The function source code can be found from [here](./src/index.ts).

The function is defined as below:

```typescript
export type UrlProcessorResult = {
    dataset: Record;
    distributions: Record[];
};

export default async function myFunction(
    input: string
): Promise<UrlProcessorResult>;
```

It expects an url string as input and output an `UrlProcessorResult` type data.

### Install Project Dependencies

```bash
yarn install
```

### Build & Run Function in Minikube

-   Deploy Magda v0.0.57-0 or later
-   Build the function
    -   Run `yarn build`
-   Push docker image to minikube
    -   Run `eval $(minikube docker-env)`
    -   Run `yarn docker-build-local`
-   Deploy function to Minikube
    -   Make sure `namespacePrefix` field in [`deploy/minikube-dev.yaml`](./deploy/minikube-dev.yaml) contains correct `magda-core` deploy namespace. By default, it's `default` and it works if you've deployed Magda to `default` namespace.
    -   Run `yarn deploy-local`
-   Invoke your Function:
    -   Install [`faas-cli`](https://github.com/openfaas/faas-cli)
    -   Run `kubectl --namespace=[openfaas gateway namespace] port-forward svc/gateway 8080` to port-forward openfaas gateway
        -   Here, [openfaas gateway namespace] is `[magda-core namespace]-openfaas`. e.g. if magda is deployed to `default` namespace, `[openfaas gateway namespace]` would be `default-openfaas`
    -   Invoke by Run `echo "" | faas-cli faas-cli invoke magda-function-esri-url-processor`
    -   Alternatively, you can use [Postman](https://www.postman.com/) to send a HTTP Request (HTTP method doesn't matter here) to Magda gateway `/api/v0/openfaas/function/magda-function-esri-url-processor`

### Deploy with Magda

-   Add as Magda dependencies:

```yaml
- name: magda-function-esri-url-processor
  version: "2.0.0" # or put latest version number here
  repository: "oci://ghcr.io/magda-io/charts"
  tags:
      - all
      - url-processors
      - magda-function-esri-url-processor
```

> Since v2.0.0, we use [Github Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry) as our official Helm Chart & Docker Image release registry.

-   Run `helm dep build` to pull the dependency
-   Deploy Magda

### Verify the function is deployed

-   Method One:
    -   Access Magda Gateway: `/api/v0/openfaas/system/function` with your web browser
        -   You might need Admin access to access this endpoint. However, you can disable the admin auth in Magda config.
-   Method Two:
    -   Run `kubectl --namespace=[openfaas function namespace] get functions`
        -   Here, [openfaas function namespace] is `[magda-core namespace]-openfaas-fn`. e.g. if magda is deployed to `default` namespace, `[openfaas function namespace]` would be `default-openfaas-fn`

> If the `Scale to Zero` option is set for the function (it's set to true by default), you won't see function pod in openfaas function namespace until you invoke the function

### CI Setup

This repo comes with script to build, test & release script to release docker image & helm chart to Magda repo. You need to setup the following Github action secrets to make it work:

-   `AWS_ACCESS_KEY_ID`: Magda helm chart repo S3 bucket access key
-   `AWS_SECRET_ACCESS_KEY`: Magda helm chart repo S3 bucket access key secret
-   `DOCKER_HUB_PASSWORD`: Magda docker hub bot password
-   `GITHUB_ACCESS_TOKEN`: Magda github bot access token

## Requirements

Kubernetes: `>= 1.14.0-0`

| Repository                    | Name         | Version |
| ----------------------------- | ------------ | ------- |
| oci://ghcr.io/magda-io/charts | magda-common | 2.1.1   |

## Values

| Key                          | Type   | Default                               | Description |
| ---------------------------- | ------ | ------------------------------------- | ----------- |
| defaultImage.imagePullSecret | bool   | `false`                               |             |
| defaultImage.pullPolicy      | string | `"IfNotPresent"`                      |             |
| defaultImage.repository      | string | `"ghcr.io/magda-io"`                  |             |
| global.image                 | object | `{}`                                  |             |
| global.openfaas              | object | `{}`                                  |             |
| global.urlProcessors.image   | object | `{}`                                  |             |
| image.name                   | string | `"magda-function-esri-url-processor"` |             |
| resources.limits.cpu         | string | `"100m"`                              |             |
| resources.requests.cpu       | string | `"50m"`                               |             |
| resources.requests.memory    | string | `"30Mi"`                              |             |
