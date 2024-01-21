import browser from "webextension-polyfill"

// Default global settings for the extension
export const settings = {
    browser: browser,
    DASH_PATH: '/wam/dashboard.html',
    OPTIONS_PATH: '/wam/options.html',
    STORAGE_KEY_EXCLUDE_PATTERN: 'wamGlobalExcludePatterns',
    STORAGE_KEY_INCLUDE_PATTERN: 'wamGlobalIncludePatterns',
    STORAGE_KEY_BLOCK_PATTERN: 'wamGlobalBlockPatterns',
    STORAGE_KEY_MASK_PATTERN: 'wamGlobalMaskPatterns',
    STORAGE_KEY_OPEN_ADDON_IN_TAB: 'wamOpenAddonInTab',
}

const FORBIDDEN_HEADERS = ['Accept-Charset', 'Accept-Encoding', 'Access-Control-Request-Headers', 'Access-Control-Request-Method', 'Connection', 'Content-Length', 'Cookie', 'Cookie2', 'Date', 'DNT', 'Expect', 'Feature-Policy', 'Host', 'Keep-Alive', 'Origin', 'Proxy-', 'Sec-', 'Referer', 'TE', 'Trailer', 'Transfer-Encoding', 'Upgrade', 'Via']
const FORBIDDEN_HEADERS_PATTERN = ['Proxy-', 'Sec-']
const DELIMITER_AND = '&'
const DELIMITER_OR = '|'
const DELIMITER_REQUEST_COOKIE = ' '
const DELIMITER_REQUEST_COOKIE_KEY_NAME = 'Cookie'
const DELIMITER_RESPONSE_COOKIE = '\n'
const DELIMITER_RESPONSE_COOKIE_KEY_NAME = 'set-cookie'
const STRING_ERROR = 'ERR'
const STRING_SPACE = '&nbsp'