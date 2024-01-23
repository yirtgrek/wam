import { WebRequest, webRequest } from "webextension-polyfill";
import { Request, addRequestBuilder, getRequestBuilder, requestFromBeforeRequest } from './project'

export function logBeforeRequest(details: WebRequest.OnBeforeRequestDetailsType) {   
    // Create the request
    let request: Request = requestFromBeforeRequest(details)
    // Save the request
    Promise.allSettled([addRequestBuilder(request)])
    .then( () => {})
    return 
}

export async function logSendHeaders(details: WebRequest.OnSendHeadersDetailsType) {
    // Get request
    let request = await getRequestBuilder(details.requestId)
    if (request == undefined) {
        console.error(`Could not log headers: ${details}`)
        return 
    }
    // add headers to request
    request.requestHeaders = details.requestHeaders
    // Save updated request
    await addRequestBuilder(request)
}

export async function logOnCompleted(details: WebRequest.OnCompletedDetailsType) {
    // Get request
    let request = await getRequestBuilder(details.requestId)
    if (request == undefined) {
        console.error(`Could not log on complete: ${details}`)
        return
    }
    // add headers to request
    request.responseHeaders = details.responseHeaders
    request.statusCode = details.statusCode
    request.statusLine = details.statusLine
    request.requestSize = details.requestSize
    request.responseSize = details.responseSize
    // Save request
    // Save updated request
    await addRequestBuilder(request)
}