import SlSelect from "@shoelace-style/shoelace/dist/components/select/select";
import { Project, getProjectList } from "./project";
import SlOption from "@shoelace-style/shoelace/dist/components/option/option";
import { settings } from "./settings";
import { SlInput, SlTextarea } from "@shoelace-style/shoelace";

export function setActiveProjectDom(project: Project) {
    //@ts-ignore
    let projectSelect: SlSelect = document.getElementById("project-select")!
    projectSelect.value = project.name.trim().replace(/\s+/g, "-") // replace spaces with '-' for value
    updateDetailDrawerDom(project)
    let leftPanel = document.getElementById("left-panel")
    let bottomPanel = document.getElementById("bottom-panel") 
    leftPanel!.innerHTML = project.name
    bottomPanel!.innerHTML = project.name
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