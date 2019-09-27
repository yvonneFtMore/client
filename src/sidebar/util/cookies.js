import Cookies from 'js-cookie';

function getCookie(key) {
    return getValueFromCookie(key) || getValueFromQueryString(key)
}

function getValueFromCookie(key){
    return Cookies.getJSON(key)
}

function getValueFromQueryString(key){
    let values = {
        token: 'wxepaw6q1vihpd7rgv8w0ohddg90dnwd',
        user_attachment_id: 1
    }
    return values[key]
}

module.exports = {
    getCookie,
};