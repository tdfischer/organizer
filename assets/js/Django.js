const getCookie = name => {
    const cookie = document.cookie
        .split(';')
        .find(cookie => cookie.startsWith(name + '=')) || ''
    return decodeURIComponent(cookie.substring(name.length + 1))
}

export var csrftoken = getCookie('csrftoken')
