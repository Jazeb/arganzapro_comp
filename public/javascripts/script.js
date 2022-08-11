function sendRequest(body) {
    const xhr = new XMLHttpRequest();

    xhr.open('PUT', '/profile', true);

    xhr.setRequestHeader('Content-type', 'application/json');

    xhr.onprogress = () => console.log('LOADING', xhr.readyState);

    xhr.onload = () => console.log('DONE', xhr.readyState);

    xhr.send(JSON.stringify(body));
}

const id = window.sessionStorage.getItem('id');
if (id && id == 1122) {
    console.log(' id found', id)
    window.sessionStorage.setItem('id', id);
    // window.localStorage.setItem('id', id);
} else {
    console.log('id not present')
    window.location.href = 'http://localhost:4000/login';
}