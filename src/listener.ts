import { WebRequest, webRequest } from "webextension-polyfill";
import { Request, addPage, addRequestBuilder, getActiveProject, getRequestBuilder, requestFromBeforeRequest, saveRequest } from './project'
import { settings } from "./settings";

export function addListeners(scope: WebRequest.RequestFilter) {
    settings.browser.webRequest.onBeforeRequest.addListener( logBeforeRequest, scope, ['requestBody'])
    settings.browser.webRequest.onSendHeaders.addListener( logSendHeaders, scope, ['requestHeaders'])
    settings.browser.webRequest.onCompleted.addListener( logOnCompleted, scope, ['responseHeaders'])
}

export function removeListeners() {
    settings.browser.webRequest.onBeforeRequest.removeListener(logBeforeRequest)
    settings.browser.webRequest.onSendHeaders.removeListener(logSendHeaders)
    settings.browser.webRequest.onCompleted.removeListener(logOnCompleted)
    
}

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
    // Save Final request
    await saveRequest(request)
    // Save pages
    const project = await getActiveProject()
    if (project == undefined) {
        return console.error("LogOnCompleted: Listener set but project isn't")
    }
    await addPage(request.destination, request.id, project.name)
    if (request.source != undefined) {
        await addPage(request.source, request.id, project.name)
    }
}