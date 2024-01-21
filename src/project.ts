import { WebRequest } from 'webextension-polyfill'
import { settings } from './settings'

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