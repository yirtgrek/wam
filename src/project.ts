import { WebRequest } from 'webextension-polyfill'
import { settings } from './settings'
import { v4 as uuidv4 } from 'uuid'
import { addPagesToPanelDom } from './dom'

// Gets a list of all saved projects
//
// Returns an array of each project name or undefined
export async function getProjectList(): Promise<string[] | undefined>  {
    try {
        let result: Record<string, string[] | undefined> = await settings.browser.storage.local.get(["project_list"])
        return result.project_list
    } catch (error) {
        console.error(`getProjectList: ${error}`)
        return undefined
    }
}

// Sets the current active project
//
// Returns the true if set successfully or false if an error occored
export async function setActiveProject(project: string): Promise<boolean> {
    try {
        await settings.browser.storage.local.set({"active_project": project})
        return true
    } catch (error) {
        console.error(`setActiveProject: ${error}`)
        return false
    }
}

export type Project = {
    // name is also a unique id used to fetch the project
    name: string
    // See filter patterns: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns
    scope: WebRequest.RequestFilter;
    // Web pages that a request was recorded from
    // Array of ids that can be used to look up the page information with getPage("page")
    pages: string[]
    // User added notes
    notes: string
}

// Gets the current active project
//
// Returns a string with the name of the active project or undefined
export async function getActiveProject(): Promise<Project | undefined> {
    try {
        let result: Record<string, string | undefined> = await settings.browser.storage.local.get(["active_project"])
        if (result.active_project == undefined) {
            console.error(`getActiveProject: active_project record not set`)
            return undefined
        }
        let project: Record<string, Project | undefined> = await settings.browser.storage.local.get([result.active_project])
        return project[result.active_project]
    } catch (error) {
        console.error(`getActiveProject: ${error}`)
        return undefined
    }
}

// Gets a saved project
//
// Return the Project or null if an error occured
export async function getProject(project: string): Promise<Project | undefined> {
    try {
        let result: Record<string, Project | undefined> = await settings.browser.storage.local.get([project])
        return result[project]
    } catch (error) {
        console.error(`getProject: ${error}`)
        return undefined
    }
}

// Updates the scope and notes of a project
//
// Returns the true if successful or false
export async function updateProject(project: Project): Promise<boolean> {
    try {
        // Update project with lock
        navigator.locks.request("project_update", async (lock) => {
            const result: Record<string, Project | undefined> = await settings.browser.storage.local.get([project.name])
            let old_project = result[project.name]
            old_project!.scope = project.scope
            old_project!.notes = project.notes
            await settings.browser.storage.local.set({[project.name]: old_project})
        })
        return true
    } catch (error) {
        console.error(`updateProject: ${error}`)
        return false
    }
}

// Add a new project and set it as current active project
//
// Returns true if added or false if error
export async function addProject(project: Project): Promise<boolean> {
    try {
        // Check if name is taken
        let name_check_result: Record<string, Project> = await settings.browser.storage.local.get([project.name])
        if (name_check_result[project.name] != undefined) {
            console.error(`addProject: name already in use`)
            return false
        }
        // Update project list with new name
        let project_list_result: Record<string, string[] | undefined> = await settings.browser.storage.local.get(["project_list"])
        let project_list = project_list_result.project_list
        if (project_list == undefined) {
            project_list = []
        }
        project_list.push(project.name)
        await settings.browser.storage.local.set({"project_list": project_list})
        // Set new project
        await settings.browser.storage.local.set({[project.name]: project})
        // Set active project
        await settings.browser.storage.local.set({"active_project": project.name})

        return true
    } catch (error) {
        console.error(`newProject: ${error}`)
        return false
    }
}

export type Request = {
    // A unique ID that is gernerated and used to get requests
    id: string
    // Page that request originated from
    // This is also a page ID 
    source?: string
    // Page that was requested
    // this is also a page ID
    destination: string
    // request method e.g. GET, POST
    method: string
    // Request IDs are unique within a browser session, they relate different events associated with the same request.
    // This is only used when composing request-response pairs internally but for all other situations you should use id
    requestId: string
    // request Headers
    requestHeaders?: WebRequest.HttpHeaders
    // response Headers
    responseHeaders?: WebRequest.HttpHeaders
    // request body
    body?: WebRequest.OnBeforeRequestDetailsTypeRequestBodyType
    // The time when this event fired, in milliseconds since the epoch
    timestamp: number
    // The server IP address that the request was actually sent to. 
    ip?: string
    // Standard HTTP status code returned by the server
    statusCode: number
    // HTTP status line of the response or the 'HTTP/0.9 200 OK' string for HTTP/0.9 responses 
    //(i.e., responses that lack a status line) or an empty string if there are no headers.
    statusLine: string
    // For http requests, the bytes transferred in the request.
    requestSize: number
    // For http requests, the bytes received in the request.
    responseSize: number
    // Type of requested resource e.g. "image", script
    type: WebRequest.ResourceType
    // If user sent modified request
    custom: boolean
}

export function requestFromBeforeRequest(details: WebRequest.OnBeforeRequestDetailsType): Request {
    let request: Request = {
        id: uuidv4(),
        source: details.documentUrl,
        destination: details.url,
        method: details.method,
        requestId: details.requestId,
        requestHeaders: undefined, // Headers we don't have yet
        responseHeaders: undefined, // Headers we don't have yet
        body: details.requestBody,
        timestamp: details.timeStamp,
        type: details.type,
        statusCode: 0,
        statusLine: '',
        requestSize: 0,
        responseSize: 0,
        custom: false
    }

    return request
}

// Add a request that is still being processed
// It is accessed by it's requestId
//
// Returns true if stored or false if error
export async function addRequestBuilder(request: Request): Promise<boolean>  {
    try {
        await settings.browser.storage.local.set({[request.requestId]: request})
        return true
    } catch (error) {
        console.error(`addRequestBuilder: ${error}`)
        return false
    }
}

// Get a request by it's uuid
//
// Returns the request or undefined if error
export async function getRequest(id: string): Promise<Request | undefined>  {
    try {
        let request = await settings.browser.storage.local.get([id])
        return request[id]
    } catch (error) {
        console.error(`getRequest: ${error}`)
        return undefined
    }
}

// Get a request that is still being processed
// It is accessed by it's requestId
//
// Returns the request or undefined if error
export async function getRequestBuilder(requestId: string): Promise<Request | undefined>  {
    try {
        let request = await settings.browser.storage.local.get([requestId])
        return request[requestId]
    } catch (error) {
        console.error(`getRequestBuilder: ${error}`)
        return undefined
    }
}

// Add a request to the db by it's unique ID
// This should be called after finished building request with request builder
//
// Returns true if stored or false if error
export async function saveRequest(request: Request): Promise<boolean>  {
    try {
        await settings.browser.storage.local.set({[request.id]: request})
        return true
    } catch (error) {
        console.error(`addRequestBuilder: ${error}`)
        return false
    }
}

export type Page = {
    // The Url of the page. Serves as unique id to fetch the page
    id: string
    // Nickname of page set by user to appear on graph
    nick: string
    // Set of requests to or from the webpage
    requests: string[]
    // User added notes
    notes: string
}

// Get a Page
//
// Returns the page or undefined if error
export async function getPage(pageId: string): Promise<Page | undefined>  {
    try {
        let request = await settings.browser.storage.local.get([pageId])
        return request[pageId]
    } catch (error) {
        console.error(`getRequestBuilder: ${error}`)
        return undefined
    }
}

// Add a new request to a page in a project
// If the page doesn't exist it makes a new page record
export async function addPage(pageId: string, requestId: string, project: string)  {
    try {
        // Use a lock on pageId to prevent issues when a new request is added at the same time
        // a page details are updated by the user
        navigator.locks.request(pageId, async (lock) => {
            const record: Record<string, Page | undefined> = await settings.browser.storage.local.get([pageId])
            let page = record[pageId]
            // If we don't have it saved we make a new page and add to current project
            // Also update the dom with the new page
            if (page == undefined) {
                // Update project with lock
                navigator.locks.request("project_update", async (lock) => {
                    const result: Record<string, Project | undefined> = await settings.browser.storage.local.get([project])
                    let old_project = result[project]
                    old_project?.pages.push(pageId)
                    await settings.browser.storage.local.set({[project]: old_project})
                })
                
                page = {
                    id: pageId,
                    nick: "",
                    requests: [requestId],
                    notes: ""
                }
                // Add page to db
                await settings.browser.storage.local.set({[pageId]: page})
                addPagesToPanelDom([page.id])
            } else {
                // Check if similar request already exists
                let matches: number[] = []
                // Get the index of all matched requests
                page.requests.forEach(async (old_request, index) => {
                    const check = await compareRequests(requestId, old_request)
                    if (check == true) {
                        matches.push(index)
                    }
                })
                // Delete old matches
                matches.forEach( async (match, index) => {
                    // Remove old matches based on index collected earlier
                    const splice = page?.requests.splice(match - index, 1)
                    const removed = splice?.pop()
                    if (removed == undefined) {
                        return
                    }
                    // Remove old request from db since don't need it anymore
                    await settings.browser.storage.local.remove([removed])
                })
                // Add our new request to page request list
                page.requests.push(requestId)
                // Add page to db
                await settings.browser.storage.local.set({[pageId]: page})
            }
        })
    } catch (error) {
        console.error(`addPage: ${error}`)
        return
    }
}


// Compares two request to see if they are the same
// true = same, false = different
export async function compareRequests(request1Id: string, request2Id: string): Promise<boolean> {
    const record1: Record<string, Request | undefined> = await settings.browser.storage.local.get([request1Id])
    const record2: Record<string, Request | undefined> = await settings.browser.storage.local.get([request2Id])
    const request1: Request | undefined = record1[request1Id]
    const request2: Request | undefined= record2[request2Id]
    if (request1 == undefined || request2 == undefined) {
        return false
    }

    if (
        request1.destination == request2.destination &&
        request1.method == request2.method &&
        request1.destination == request2.destination &&
        request1.custom == false && request2.custom == false
    ) {
        return true
    }
    return false
}

// Updates the nickname and notes of a Page
//
// Returns the true if successful or false
export async function updatePageDetails(page: Page): Promise<boolean> {
    try {
        // Update project with lock
        navigator.locks.request(page.id, async (lock) => {
            const result: Record<string, Page | undefined> = await settings.browser.storage.local.get([page.id])
            let old_page = result[page.id]
            old_page!.nick = page.nick
            old_page!.notes = page.notes
            await settings.browser.storage.local.set({[page.id]: old_page})
        })
        return true
    } catch (error) {
        console.error(`updateProject: ${error}`)
        return false
    }
}
