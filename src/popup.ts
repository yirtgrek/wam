import { openOptions, openDash } from './open'

// Add event listeners once the DOM has fully loaded by listening for the
// `DOMContentLoaded` event on the document, and adding your listeners to
// specific elements when it triggers.
document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('#dashBtn')!.addEventListener('click', openDash)
    document.querySelector('#optionsBtn')!.addEventListener('click', openOptions)
})