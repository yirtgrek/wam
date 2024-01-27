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
import { Project, addProject, getActiveProject, getPage, getProject, getProjectList, setActiveProject, updateProject } from './project'
import { setActiveProjectDom, addProjectDom, updateDetailDrawerDom, setupProjectSelect, setupDetailDrawer, setupNewProjectDialog } from './dom'
import { WebRequest } from 'webextension-polyfill'
import { settings } from './settings'
import { addListeners, logBeforeRequest, logOnCompleted, logSendHeaders, removeListeners } from './listener'


(async () => {

// Have to decalre shoelace stuff here in order to register it for some reason
const split = SlSplitPanel
const select = SlSelect
const option = SlOption
const button = SlButton
const drawer = SlDrawer
const textarea = SlTextarea
const dialog = SlDialog
const input = SlInput
setBasePath('../shoelace')

// Load shoelace custom elements
await customElements.whenDefined('sl-split-panel')
await customElements.whenDefined('sl-select')
await customElements.whenDefined('sl-option')
await customElements.whenDefined('sl-button')
await customElements.whenDefined('sl-drawer')
await customElements.whenDefined('sl-textarea')
await customElements.whenDefined('sl-dialog')
await customElements.whenDefined('sl-input')

// Get active project from db
let active_project = await getActiveProject()

// Populate the select project menu & set event listener for changing the project
setupProjectSelect()
// Populate the detail side drawer
setupDetailDrawer()
// Setup listeners for starting a new project
setupNewProjectDialog()

if (active_project != undefined) {
    // add listeners
    addListeners(active_project.scope)
    // Update dom
    setActiveProjectDom(active_project)  
}

document.body.classList.add('ready');

})()