function sendRequest(body) {
    const xhr = new XMLHttpRequest();

    xhr.open('PUT', '/profile', true);

    xhr.setRequestHeader('Content-type', 'application/json');

    xhr.onprogress = () => console.log('LOADING', xhr.readyState);

    xhr.onload = () => console.log('DONE', xhr.readyState);

    xhr.send(JSON.stringify(body));
}