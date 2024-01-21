import { Windows } from 'webextension-polyfill'
import { settings } from './settings'
  
// open the settings window, or if already opened, bring to front preventing multiple windows
export async function openOptions() {
    try {
        // Get all browser windows
        let windows = await settings.browser.windows.getAll({'populate': true,})

        // check if the tab is already opened
        let existingWindow: Windows.Window | undefined
        windows.some(eachWindow => {
            if (eachWindow.tabs && eachWindow.tabs.some(tab => tab.url?.includes(settings.OPTIONS_PATH))) {
                existingWindow = eachWindow
                return true
            }
        })

        // Options tab isn't already open so we open a new tab for it
        if (existingWindow == undefined) {
            return settings.browser.runtime.openOptionsPage()
        }

        // The tab is already opened so we focus it
        let tabs = await settings.browser.tabs.query({
            'windowId': existingWindow.id,
            'url': settings.browser.runtime.getURL(settings.OPTIONS_PATH),
        })

        settings.browser.windows.update(
            existingWindow!.id!, { // exisiting window is already checked for undefined
                focused: true,
            },
        )
        settings.browser.tabs.update(tabs[0].id, {
            active: true,
        })
    } catch (error) {
        console.error(`openOptions: ${error}`)
    }
}
  
// open the dashboard window, or if already opened, bring to front preventing multiple windows
// Also checks if the the window should be opened in popup window or tab
export async function openDash() {
    try {
        // Get all browser windows
        let windows = await settings.browser.windows.getAll({'populate': true })
        // Check flag if we should open the settings page in tab
        let tab_record = await settings.browser.storage.local.get([settings.STORAGE_KEY_OPEN_ADDON_IN_TAB])
        // Get the flag
        let open_in_tab: boolean | undefined = tab_record[settings.STORAGE_KEY_OPEN_ADDON_IN_TAB]
        // If no record set open_in_tab to false in storage
        if (open_in_tab == undefined) {
            settings.browser.storage.local.set({
                [settings.STORAGE_KEY_OPEN_ADDON_IN_TAB]: false,
            })
            open_in_tab = false
        }

        // Check if window is already open somewhere
        let existingWindow: Windows.Window | undefined
        windows.some((eachWindow) => {
            if (eachWindow.tabs && eachWindow.tabs.some((tab) => tab.url?.includes(settings.DASH_PATH))) {
                existingWindow = eachWindow
                return true
            }
        })

        if (open_in_tab) {
        // Open in a tab
            // No existing window so we create a new tab with the Dashboard
            if (existingWindow == undefined) {
                settings.browser.tabs.create({
                    'url': settings.browser.runtime.getURL(settings.DASH_PATH),
                })
                return
            }

            // The tab is already opened so we just need to focus it.
            let tabs = await settings.browser.tabs.query({
                'windowId': existingWindow.id,
                'url': settings.browser.runtime.getURL(settings.DASH_PATH),
            })
            settings.browser.windows.update(
                existingWindow!.id!, { // exisiting window is already checked for undefined
                    focused: true,
                },
            )
            settings.browser.tabs.update(tabs[0].id, {
                active: true,
            }) 
        } else {
        // Open in a window
            // No window is open so we make a new popup window
            if (existingWindow == undefined) {
                settings.browser.windows.create({
                    type: 'popup',
                    url: settings.browser.runtime.getURL(settings.DASH_PATH),
                    state: 'normal',
                })
                return
            }

            // A window is already open so we focus it instead of opening a new window
            let windows = await settings.browser.windows.get(existingWindow!.id!) // exisiting window is already checked for undefined
            settings.browser.windows.update(windows!.id!, { focused: true })
        }
    } catch (error) {
        console.error(`openOptions: ${error}`)
    }
}