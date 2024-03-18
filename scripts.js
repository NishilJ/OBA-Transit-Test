async function stopSearch (stop){
    const api = `https://api.pugetsound.onebusaway.org/api/where/search/stop.xml?input=${stop}&key=TEST&maxCount=5`;
    try {
        const response = await fetch(api);
        if (response.ok) {
            const text = await response.text();
            const xml = new DOMParser().parseFromString(text, 'text/xml');
            return xml.querySelectorAll('stop');
        } else if (response.status === 429) {
            return (429);
        } else {
            return (404);
        }
    }
    catch (error) {
        return null;
    }
}

async function nextDeparts (stop) {
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    const api = `https://api.pugetsound.onebusaway.org/api/where/arrivals-and-departures-for-stop/${stop}.xml?key=TEST`;
    let response;
    do {
        response = await fetch(api);
        if (response.ok) {
            const text = await response.text();
            const xml = new DOMParser().parseFromString(text, 'text/xml');
            const entry = xml.querySelector('entry.stopWithArrivalsAndDepartures');
            if (entry == null) {
                break;
            }
            const main = entry.querySelector('arrivalsAndDepartures');
            return main.querySelectorAll('arrivalAndDeparture');
        }
        await delay(2000);
    } while (!response.ok)
}

async function displayStops(userInput) {
    document.getElementById('searchResults').innerHTML= '';
    const stopsContainer = document.getElementById('searchResults');

    const stopResults = await stopSearch(userInput);

    document.addEventListener('click', function(event) {
        const searchInput = document.getElementById('stop');
        // Check if the click is outside the search input and search results
        if (!searchInput.contains(event.target) && !stopsContainer.contains(event.target)) {
            // Clear the search results
            while (stopsContainer.firstChild) {
                stopsContainer.removeChild(stopsContainer.firstChild);
            }
        }
    });

    if (stopResults == null) {
        const error = document.createElement('a');
        error.textContent = 'Error fetching stops. Please try again later.';
        stopsContainer.appendChild(error);
    }
    else if (stopResults === 404) {
        const error = document.createElement('a');
        error.textContent = 'No stops found.';
        stopsContainer.appendChild(error);
    }
    else if (stopResults === 429) {
        const error = document.createElement('a');
        error.textContent = 'To many attempts. Slow Down!';
        stopsContainer.appendChild(error);
    }
    else {
        stopResults.forEach(stopResult => {
            const stopName = document.createElement('a');
            stopName.textContent = stopResult.querySelector('name').textContent;
            stopsContainer.appendChild(stopName);

            const lineBreak = document.createElement('br');
            stopsContainer.appendChild(lineBreak);

            stopName.onclick = () => displayStopInfo(stopResult);
        });
    }
}

async function displayStopInfo(stop) {
    document.getElementById('main-header').style.display = 'none';
    document.getElementById('searchBar').style.display = 'none';
    document.getElementById('stopInfo').style.display = 'block';
    document.getElementById('departureResults').style.display = 'block';
    document.getElementById('departureResults').innerHTML= '';

    const stopName = stop.querySelector('name').textContent;
    const stopID = stop.querySelector('id').textContent;
    const stopDeparts = await nextDeparts(stopID);

    const stopInfoContainer = document.getElementById('stopInfo');
    const departuresContainer = document.getElementById('departureResults');

    const backButton = document.createElement('button');
    backButton.className = 'material-symbols-outlined';
    backButton.textContent = 'arrow_back';
    departuresContainer.appendChild(backButton);

    backButton.addEventListener('click', function() {
        stopInfoContainer.style.display = 'none';
        departuresContainer.style.display = 'none';

        document.getElementById('main-header').style.display = 'block';
        document.getElementById('searchBar').style.display = 'block';

    });

    const stopNameElement = document.createElement('h2');
    stopNameElement.textContent = stopName;
    departuresContainer.appendChild(stopNameElement);

    if (stopDeparts == null) {
        const error = document.createElement('a');
        error.textContent = 'No departures soon. Please try again later.';
        departuresContainer.appendChild(error);
    } else {
        for (const stopDepart of stopDeparts) {
            const routeNum = stopDepart.querySelector('routeShortName').textContent;
            const routeName = stopDepart.querySelector('tripHeadsign').textContent;
            let datatype;
            let departureTime = parseInt(stopDepart.querySelector('predictedDepartureTime').textContent);

            if (departureTime === 0) {
                departureTime = new Date(parseInt(stopDepart.querySelector('scheduledDepartureTime').textContent));
                datatype = "Scheduled";

            } else {
                departureTime = new Date(departureTime);
                datatype = "Predicted";
            }

            let hours = departureTime.getHours();
            let minutes = departureTime.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            minutes = minutes < 10 ? '0'+minutes : minutes;
            const strTime = hours + ':' + minutes + ' ' + ampm;

            const currentTime = new Date();
            const diffInMilliseconds = departureTime.getTime() - currentTime.getTime();
            const diffInMinutes = Math.round(diffInMilliseconds / 1000 / 60);

            let departure;
            if (diffInMinutes < 0) {
                departure = `${routeNum} - ${routeName}: Departed ${Math.abs(diffInMinutes)} min ago at ${strTime}`;
            }
            else {
                departure = `${routeNum} - ${routeName}: ${datatype} in ${diffInMinutes} min at ${strTime}`;
            }

            const departureElement = document.createElement('a');
            departureElement.textContent = departure;
            departuresContainer.appendChild(departureElement);
        }
    }
}