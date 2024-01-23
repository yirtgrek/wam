import { WebRequest } from 'webextension-polyfill'
import { settings } from './settings'
import { v4 as uuidv4 } from 'uuid'

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
    pages: Set<string>
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
// Returns the updated project or undefined if error
export async function updateProject(project: Project): Promise<Project | undefined> {
    try {
        // get old project
        const result: Record<string, Project | undefined> = await settings.browser.storage.local.get([project.name])
        let old_project = result[project.name]
        if (old_project == undefined) {
            console.error(`updateProject: couldn't find ${project.name} in db`)
            return undefined
        }
        // update the notes and scope
        old_project.scope = project.scope
        old_project.notes = project.notes
        // save update
        await settings.browser.storage.local.set({[project.name]: old_project})
        return old_project
    } catch (error) {
        console.error(`updateProject: ${error}`)
        return undefined
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
        responseSize: 0
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