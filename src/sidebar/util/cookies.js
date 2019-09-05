import Cookies from 'js-cookie';

function getCookie(key) {
    return getValueFromCache(key) || getValueFromQueryString(key)
}

function getValueFromCache(key){
    return Cookies.getJSON(key)
}

function getValueFromQueryString(key){
    let values = {
        token: 'uulx7rcgxvdljm04rrtu715w694ref4p',
        user_attachment_id: 1
    }
    return values[key]
}

module.exports = {
    getCookie,
};