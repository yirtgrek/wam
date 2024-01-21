import '@shoelace-style/shoelace/dist/themes/dark.css'
import SlSplitPanel from '@shoelace-style/shoelace/dist/components/split-panel/split-panel'
import SlSelect from '@shoelace-style/shoelace/dist/components/select/select'
import SlOption from '@shoelace-style/shoelace/dist/components/option/option'
import SlButton from '@shoelace-style/shoelace/dist/components/button/button'
import SlDrawer from '@shoelace-style/shoelace/dist/components/drawer/drawer'
import SlTextarea from '@shoelace-style/shoelace/dist/components/textarea/textarea'
import SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog'
import SlInput from '@shoelace-style/shoelace/dist/components/input/input'
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path'
import { Project, addProject, getActiveProject, getProject, getProjectList, setActiveProject, updateProject } from './project'
import { setActiveProjectDom, addProjectDom, updateDetailDrawerDom } from './dom'
import { WebRequest } from 'webextension-polyfill'
import { settings } from './settings'

// Have to decalre shoelace stuff here in order to register it
const split = SlSplitPanel
const select = SlSelect
const option = SlOption
const button = SlButton
const drawer = SlDrawer
const textarea = SlTextarea
const dialog = SlDialog
const input = SlInput
setBasePath('../shoelace')

// Once everything is loaded we can display the app
// (This shouldn't be noticable to users)
Promise.allSettled([
    customElements.whenDefined('sl-split-panel'),
    customElements.whenDefined('sl-select'),
    customElements.whenDefined('sl-option'),
    customElements.whenDefined('sl-button'),
    customElements.whenDefined('sl-drawer'),
    customElements.whenDefined('sl-textarea'),
    customElements.whenDefined('sl-dialog'),
    customElements.whenDefined('sl-input'),
]).then( () => {
    document.body.classList.add('ready');
});

// App state
let active_project: Project | undefined = undefined;


(async () => {

// Get active project from db
active_project = await getActiveProject()

//
// Project Select 
//

// Get select element
const projectSelect: SlSelect = document.querySelector('#project-select')! // These aren't null because we control the html

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
    active_project = await getActiveProject()
    if (active_project == undefined) {
        // some error happened getting the new project from db. This is unlikely unless
        // browser crashes.
        console.log("project Select listener can't get active project")
        return
    }
    // Update dome with the new active project
    setActiveProjectDom(active_project)
})

//
// End Project Select 
//

//
// Details Side Drawer
//

const detailsDrawer: SlDrawer = document.querySelector('#details-drawer')!
const openScopeButton: SlButton = document.querySelector('#openDetailsBtn')!
const closeScopeButton: SlButton = document.querySelector('#closeDetailsBtn')!
// Open side drawer when clicking "details" button in top menu
openScopeButton.addEventListener('click', () => detailsDrawer.show())
// Close the side drawer when clicking close button
closeScopeButton.addEventListener('click', () => detailsDrawer.hide())

// Js for saving the updated info when form submit
const detailsForm: HTMLFormElement = document.querySelector('#detailsForm')!
const detailsName: SlInput = document.querySelector('#detailsName')!
const detailsScope: SlTextarea = document.querySelector('#detailsScope')!
const detailsNotes: SlTextarea = document.querySelector('#detailsNotes')!
const saveDetailsBtn: SlButton = document.querySelector('#saveDetailsBtn')!

detailsForm.addEventListener("submit", async (ev) => {
    ev.preventDefault()
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
        pages: new Set<string>()
    }
    let update = await updateProject(project)
    if (update == undefined) {
        // error happend return early
        // the update function should log the error
        return
    }
    // update active project with new info
    active_project = update
    // update details drawer with new saved info
    updateDetailDrawerDom(update)
    saveDetailsBtn.loading = false
    detailsDrawer.hide()
})

//
// End Details Side Drawer
//

//
// New Project Dialog 
//

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
    console.log(project)
    if (project == undefined) {
        return newProjectNameInput.setCustomValidity('');
    }
    newProjectNameInput.setCustomValidity("Project name is taken.");
});

// Submit the form and save the new project
// We also set the new project as the current active project
newProjectForm.addEventListener("submit", async (ev) => {
    ev.preventDefault()
    saveDetailsBtn.loading = true
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
        pages: new Set<string>()
    }
    // Add project to db and set as active project
    await addProject(project)
    active_project = project
    // Add project to select drop down
    addProjectDom(project.name)
    // Use project as the current active project and update all dom elements
    setActiveProjectDom(project)
    // reset new project form
    newProjectNameInput.value = ""
    newProjectScopeInput.value = ""
    newProjectNotesInput.value = ""
    saveDetailsBtn.loading = false
    newProjectDialog.hide()
})

//
// End New Project Dialog 
//

if (active_project  != undefined) {
    setActiveProjectDom(active_project)
}

})()