const getCookie = name => {
    const cookie = document.cookie
        .split(';')
        .find(cookie => cookie.trim().startsWith(name + '=')) || ''
    return decodeURIComponent(cookie.trim().substring(name.length + 1))
}

export var csrftoken = getCookie('csrftoken')
