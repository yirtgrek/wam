import { Page, Project, addProject, getActiveProject, getPage, getProject, getProjectList, getRequest, setActiveProject, updatePageDetails, updateProject } from "./project";
import { settings } from "./settings";
import { addListeners, removeListeners } from "./listener";

import SlSplitPanel from '@shoelace-style/shoelace/dist/components/split-panel/split-panel'
import SlSelect from '@shoelace-style/shoelace/dist/components/select/select'
import SlOption from '@shoelace-style/shoelace/dist/components/option/option'
import SlButton from '@shoelace-style/shoelace/dist/components/button/button'
import SlDrawer from '@shoelace-style/shoelace/dist/components/drawer/drawer'
import SlTextarea from '@shoelace-style/shoelace/dist/components/textarea/textarea'
import SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog'
import SlInput from '@shoelace-style/shoelace/dist/components/input/input'
import { WebRequest } from "webextension-polyfill";

// Updates the entire UI with info for the current project
// You also need to update event listeners using remove/add from listener.ts
export function setActiveProjectDom(project: Project) {
    // Set the project select in the top menu
    //@ts-ignore
    let projectSelect: SlSelect = document.getElementById("project-select")!
    projectSelect.value = project.name.trim().replace(/\s+/g, "-") // replace spaces with '-' for value
    // Set the detail button & drawer to the current project info
    updateDetailDrawerDom(project)
    // Add the pages of the current project to the left panel table
    const pagesTableBody = document.querySelector('#pagesTableBody')!
    // clear any old content before setting new content
    pagesTableBody.textContent = ''
    addPagesToPanelDom(project.pages)
}

// Add pages to the left panel table
// These supplied list is an id of the page you want to add
export function addRequestsToPanelDom(requests: string[]) {
    const requestTableBody = document.querySelector('#requestTableBody')!
    requests.forEach(async (requestId) => {
        let request = await getRequest(requestId)
        if (request != undefined) {
            // Make table row
            let tr = document.createElement("tr")
            tr.dataset.id = request.id
            // Make td for name, id, page
            let name = document.createElement("td")
            name.innerHTML = request.destination
            let status = document.createElement("td")
            status.innerHTML = String(request.statusCode)
            let type = document.createElement("td")
            type.innerHTML = request.type
            let method = document.createElement("td")
            method.innerHTML = request.method
            // Add td to tr then add the tr to the table body
            tr.appendChild(name)
            tr.appendChild(status)
            tr.appendChild(type)
            tr.appendChild(method)
            tr.addEventListener("click", function handleClick(event) {
                console.log(this.dataset.id)
            })
            requestTableBody.appendChild(tr)
        }
    })
}

// Add pages to the left panel table
// These supplied list is an id of the page you want to add
export function addPagesToPanelDom(pages: string[]) {
    const pagesTableBody = document.querySelector('#pagesTableBody')!
    pages.forEach(async (pageId) => {
        let page = await getPage(pageId)
        if (page != undefined) {
            // Make table row
            let tr = document.createElement("tr")
            tr.id = page.id
            tr.dataset.id = page.id
            // Make td for name, id, page
            let name = document.createElement("td")
            name.innerHTML = page.nick
            let id = document.createElement("td")
            id.innerHTML = page.id
            let notes = document.createElement("td")
            notes.innerHTML = page.notes
            // Add td to tr then add the tr to the table body
            tr.appendChild(name)
            tr.appendChild(id)
            tr.appendChild(notes)
            tr.addEventListener("click", async function handleClick(event) {
                console.log(this.dataset.id)
                const requestTableBody = document.querySelector('#requestTableBody')!
                // clear request from old pages
                requestTableBody.textContent = ''
                addRequestsToPanelDom(page!.requests)
                // open side drawer with page details 
                const pageDrawer: SlDrawer = document.querySelector('#pageDrawer')!
                // Load new info
                await updatePageDrawerDom(page!.id)
                pageDrawer.open = !pageDrawer.open
            })
            pagesTableBody.appendChild(tr)
        }
    })
}

// Updates the info Page drawer to current the provided Page
export async function updatePageDrawerDom(pageId: string) {
    let page = await getPage(pageId)

    //@ts-ignore
    let name: SlInput = document.getElementById("pageName")!
    //@ts-ignore
    let url: SlInput = document.getElementById("pageUrl")!
    //@ts-ignore
    let notes: SlTextarea = document.getElementById("pageNotes")!

    if (page == undefined) {
        // error logged in get page request
        // set values to error
        name.value = "error"
        url.value = "error"
        notes.value = "error"
        return
    }

    name.value = page.nick
    url.value = page.id
    notes.value = page.notes
}


// Add a project to the top menu project select component
export function addProjectDom(projectName: string) {
    //@ts-ignore
    let projectSelect: SlSelect = document.getElementById("project-select")!
    //@ts-ignore
    let option: SlOption = document.createElement("sl-option")
    option.value = projectName.trim().replace(/\s+/g, "-") // replace spaces with '-' for value
    option.innerHTML = projectName
    projectSelect.appendChild(option)
}

// Updates the info in the detail Drawer with info of the current project
export function updateDetailDrawerDom(project: Project) {
    //@ts-ignore
    let name: SlInput = document.getElementById("detailsName")!
    name.value = project.name
    //@ts-ignore
    let scope: SlTextarea = document.getElementById("detailsScope")!
    scope.value = project.scope.urls.join('\r\n')
    //@ts-ignore
    let notes: SlTextarea = document.getElementById("detailsNotes")!
    notes.value = project.notes
}

// Sets up the opening and closing of the table drawers
export async function setupTables() {
    // Setup close buttons
    const pageDrawer: SlDrawer = document.querySelector('#pageDrawer')!
    const closePageDrawerButton: SlButton = document.querySelector('#closePageDrawerBtn')!
    closePageDrawerButton.addEventListener('click', () => pageDrawer.hide())

    // Js for saving the updated page info when form submitted
    const pageName: SlInput = document.querySelector('#pageName')!
    const pageId: SlInput = document.querySelector('#pageUrl')!
    const pageNotes: SlTextarea = document.querySelector('#pageNotes')!
    const savePageDetailsBtn: SlButton = document.querySelector('#savePageDetailsBtn')!

    savePageDetailsBtn.addEventListener("click", async (ev) => {
        savePageDetailsBtn.loading = true
        // Get project name
        // This is a nick name the user can asign a page
        const name = pageName.value
        // The url which is also used as the page id
        const id = pageId.value
        const notes = pageNotes.value
        // We add pages as a placeholder but the update function doesn't use it
        let page: Page = {
            id: id,
            nick: name,
            notes: notes,
            requests: []
        }
        let update = await updatePageDetails(page)
        if (update == false) {
            // error happend return early
            // the update function should log the error
            return
        }
        // update table item with new saved info
        updatePageTableItemDom(page)
        savePageDetailsBtn.loading = false
    })
}

function updatePageTableItemDom(page: Page) {
    //@ts-ignore
    let row: HTMLTableRowElement = document.getElementById(page.id)!
    // Get the cells within the row 
    let nameCell: HTMLTableCellElement = row.cells[0]
    let notesCell: HTMLTableCellElement = row.cells[2]
    // Update cells
    nameCell.innerHTML = page.nick
    notesCell.innerHTML = page.notes
}

// Sets the select project dropdown for the top menu
// This doesn't set the current project. Just populates the 
// select element with all options. Use setActiveProjectDom to set the value
export async function setupProjectSelect() {
    // Get select element
    const projectSelect: SlSelect = document.querySelector('#project-select')!

    // get list of all projects in the db
    let projectList: string[] | undefined = await getProjectList()
    if (projectList == undefined) {
        // if we don't have anything set in db we store an empty list for next time
        // this only happens on first run
        projectList = []
        await settings.browser.storage.local.set({"project_list": projectList})
    }

    // for each project add it as an option to the select menu
    projectList.forEach((projectName) => {
        // create option
        let option: SlOption = document.createElement("sl-option")
        // if project name has spaces replace with '-' for value because values shouldn't have spaces
        option.value = projectName.trim().replace(/\s+/g, "-") 
        option.innerHTML = projectName
        projectSelect.appendChild(option)
    })

    // Event listener for Changing project via select menu
    projectSelect.addEventListener('sl-change', async event => {
        // get the new value. Switch - to space since values can't have spaces but the
        // project name in db is stored with spaces.
        //@ts-ignore
        const project_name: string = event.target.value.replace("-", " ")
        // set new selected project as the active project in db and app state
        await setActiveProject(project_name)
        let active_project = await getActiveProject()
        if (active_project == undefined) {
            // some error happened getting the new project from db. This is unlikely unless
            // browser crashes.
            console.log("project Select listener can't get active project")
            return
        }
        // Update UI with the new active project
        setActiveProjectDom(active_project)
        // Change Listeners
        removeListeners()
        addListeners(active_project.scope)
    })
}

// Sets up the event listener for the detail drawer and detail button
// This doesn't set the current project information. It just sets up
// the listeners so all the buttons work as expected when saving, opening, ect.
export async function setupDetailDrawer() { 
    const detailsDrawer: SlDrawer = document.querySelector('#details-drawer')!
    const openScopeButton: SlButton = document.querySelector('#openDetailsBtn')!
    const closeScopeButton: SlButton = document.querySelector('#closeDetailsBtn')!
    // Open side drawer when clicking "details" button in top menu
    openScopeButton.addEventListener('click', () => detailsDrawer.show())
    // Close the side drawer when clicking close button
    closeScopeButton.addEventListener('click', () => detailsDrawer.hide())
    
    // Js for saving the updated info when form submit
    const detailsName: SlInput = document.querySelector('#detailsName')!
    const detailsScope: SlTextarea = document.querySelector('#detailsScope')!
    const detailsNotes: SlTextarea = document.querySelector('#detailsNotes')!
    const saveDetailsBtn: SlButton = document.querySelector('#saveDetailsBtn')!
    
    saveDetailsBtn.addEventListener("click", async (ev) => {
        saveDetailsBtn.loading = true
        // Get project name
        // User can't change this since it's a unique id
        const name = detailsName.value
        // Get scope we split by new line then trim any whitespace.
        // This should be an array of https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns
        let scope = detailsScope.value.split(/\r?\n/)
        scope.forEach((element, index) => {
            scope[index] = element.trim();
        })
        // We use our new scope to make a request filter
        let filter: WebRequest.RequestFilter = {
            urls: scope
        }
        const notes = detailsNotes.value
        // We add pages as a placeholder but the update function doesn't use it
        let project: Project = {
            name: name,
            scope: filter,
            notes: notes,
            pages: []
        }
        let update = await updateProject(project)
        if (update == false) {
            // error happend return early
            // the update function should log the error
            return
        }
        // update details drawer with new saved info
        updateDetailDrawerDom(project)
        saveDetailsBtn.loading = false
        detailsDrawer.hide()
    })
}

// Sets up the event listeners for the new project button and dialog popup
// If a new project is created the new project is automatically set as the active project
export function setupNewProjectDialog() {
    const newProjectDialog: SlDialog = document.querySelector('#new-project-dialog')!
    const openNewProjectButton: SlButton = document.querySelector('#openNewProjectBtn')!
    const closeNewProjectButton: SlButton = document.querySelector('#closeNewProjectBtn')!
    // Open the new project dialog form when clicking 'new project' button on top menu
    openNewProjectButton.addEventListener('click', () => newProjectDialog.show())
    // Close without saving when clicking the close button
    closeNewProjectButton.addEventListener('click', () => newProjectDialog.hide())

    // Js for saving the new project on form submit
    const newProjectForm: HTMLFormElement = document.querySelector('#newProjectForm')!
    const newProjectNameInput: SlInput = document.querySelector('#newProjectName')!
    const newProjectScopeInput: SlTextarea = document.querySelector('#newProjectScope')!
    const newProjectNotesInput: SlTextarea = document.querySelector('#newProjectNotes')!
    const saveNewProjectBtn: SlButton = document.querySelector('#saveNewProjectBtn')!

    // Listener that checks if a project name is already in use
    // We use project names as unique IDs so this prevents submitting duplicates
    newProjectNameInput.addEventListener('sl-input', async () => {
        // check if project name already exists
        let project = await getProject(newProjectNameInput.value)
        if (project == undefined) {
            return newProjectNameInput.setCustomValidity('');
        }
        newProjectNameInput.setCustomValidity("Project name is taken.");
    });

    // Submit the form and save the new project
    // We also set the new project as the current active project
    newProjectForm.addEventListener("submit", async (ev) => {
        ev.preventDefault()
        saveNewProjectBtn.loading = true
        // Get name it should be uniqued an is checked with an event listener and setCustomValidity
        const name = newProjectNameInput.value
        // Get scope we split by new line then trim any whitespace.
        // This should be an array of https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns
        let scope = newProjectScopeInput.value.split(/\r?\n/)
        scope.forEach((element, index) => {
            scope[index] = element.trim();
        })
        let filter: WebRequest.RequestFilter = {
            urls: scope
        }
        const notes = newProjectNotesInput.value
        // Make the new project
        let project: Project = {
            name: name,
            scope: filter,
            notes: notes,
            pages: []
        }
        // Add project to db and set as active project
        await addProject(project)
        // Add project to select drop down
        addProjectDom(project.name)
        // Use project as the current active project and update all dom elements
        removeListeners()
        addListeners(project.scope)
        setActiveProjectDom(project)
        // reset new project form
        newProjectNameInput.value = ""
        newProjectScopeInput.value = ""
        newProjectNotesInput.value = ""
        saveNewProjectBtn.loading = false
        newProjectDialog.hide()
    })
}