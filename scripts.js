async function stopSearch (stop){
    const api1 = 'https://api.pugetsound.onebusaway.org/api/where/search/stop.xml?input=';
    const apiCall = api1.concat('', stop, '&key=TEST&maxCount=5');

    try {
        const response = await fetch(apiCall);
        if (response.ok) {
            //console.error('Promise resolved and HTTP status is successful');
            const text = await response.text();
            const parser = new DOMParser();
            return parser.parseFromString(text, 'text/xml');
        } else if (response.status === 429) {
            //console.error('Promise resolved but HTTP status failed');
            return (429);
        } else  {
            //console.error('Promise resolved but HTTP status failed');
            return (404);
        }
    }
    catch (error) {
        //console.error('Error fetching data:', error);
        return null;
    }

}
async function displayStops(userInput) {
    let e= document.getElementById("searchResults");
    let child= e.lastElementChild;
    while (child) {
        e.removeChild(child);
        child = e.lastElementChild;
    }
    const stopData = await stopSearch(userInput);
    const dropdownContainer = document.getElementById('searchResults');

    if (stopData == null) {
        const errorLink = document.createElement('a');
        errorLink.textContent = 'Error fetching stops. Please try again later.';
        dropdownContainer.appendChild(errorLink);
    }
    else if (stopData === 404) {
        const errorLink = document.createElement('a');
        errorLink.textContent = 'No stops found.';
        dropdownContainer.appendChild(errorLink);
    }
    else if (stopData === 429) {
        const errorLink = document.createElement('a');
        errorLink.textContent = 'To many attempts. Slow Down!';
        dropdownContainer.appendChild(errorLink);
    }
    else {
        const stopElements = stopData.querySelectorAll('stop');

        stopElements.forEach(stopElement => {
            const stopLink = document.createElement('a');
            stopLink.textContent = stopElement.querySelector('name').textContent;

            const lineBreak = document.createElement('br');

            dropdownContainer.appendChild(stopLink);
            dropdownContainer.appendChild(lineBreak);
        });
    }
}