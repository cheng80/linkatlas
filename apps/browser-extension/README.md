# LinkAtlas Browser Extension

Manifest V3 Chrome/Edge extension for sending the current page or selected text to LinkAtlas.

## Native Host

The extension sends messages to `com.linkatlas.native`. During packaging, copy
`native-host.example.json` to the browser Native Messaging host directory and replace the
extension id and host path with the signed app values.

## Message Contract

Payloads must match `BrowserCaptureRequestSchema` in `@linkatlas/contracts`.
Responses must match `BrowserCaptureResponseSchema`.
