window.addEventListener('load', () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').then(() => {
            console.log('Service worker registered.');
        });
    }
});

function fetchAmmoData() {
    fetch('https://api.tarkov.dev/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({query: `{
            ammo {
                caliber
                penetrationPower
                damage
                projectileCount
                armorDamage
                item {
                    shortName
                    name
                }
            }
        }`})
  })
    .then(r => r.json())
    .then(data => {localStorage.setItem("data", JSON.stringify(data));repopulateTable(data);});
}

// updated in repopulateTable() and used in search()
let search_map = new Map();

function repopulateTable(indata) {
    const data = indata || JSON.parse(localStorage.getItem("data"));
    if (!data) {
        return;
    }
    search_map.clear();
    document.querySelectorAll("#ammo_table tbody tr").forEach(tr => tr.remove());

    let tbody = document.querySelector("#ammo_table tbody");
    data.data.ammo.forEach(ammo => {
        let tr = document.createElement("tr");
        function appendTD(text) {
            let t = document.createElement("td");
            t.textContent = text;
            tr.appendChild(t);
        }
        appendTD(ammo.caliber.substr(7)); //remove the leading "Caliber"
        appendTD(ammo.item.shortName);
        let damage_and_projectile_count = ammo.damage.toString();
        if (ammo.projectileCount && ammo.projectileCount !== 1) {
            damage_and_projectile_count += "x" + ammo.projectileCount.toString();
        }
        appendTD(damage_and_projectile_count);
        appendTD(ammo.penetrationPower);
        appendTD(ammo.armorDamage + "%");
        tbody.appendChild(tr);
        let text = tr.childNodes[0].textContent.toLowerCase() +
                   " " + tr.childNodes[1].textContent.toLowerCase() + //search in caliber and shortName
                   " " + ammo.item.name.toLowerCase(); // Add full name too I guess
        search_map.set(text, tr);
    });
}

function search(event) {
//    const elem = document.getElementById('search_input');
    const elem = event.srcElement;
    let text = elem.value.toLowerCase();
    search_map.forEach((value, key) => {
        if (key.includes(text)) {
            value.classList.remove('hidden'); //show it
        } else {
            value.classList.add('hidden'); //hide the non matching rows
        }
    });
}

function sort(event) {
    const elem = event.srcElement.closest('th');
    const type = elem.dataset['type'];
    const table = elem.closest('table');
    // sort in descending order first.
    // nobody wants to see the least pen or damage on first click
    const already_descending = (elem.dataset['descending'] === "true") //dataset is a string in the html node attribute data-*
    const sorted = elem.classList.contains('sorted');
    /* Value of descending I want:
     *
             sorted│
                   │
already_descending │ T │ F
      ─────────────┼───┼───
                   │   │
                 T │ F │ T
                   │   │
                 ──┼───┼───
                   │   │
                 F │ T │ T
                   │   │
     *
     */
    const descending = !(already_descending && sorted);
    elem.dataset['descending'] = String(descending);

    table.querySelectorAll('th').forEach(th => th.classList.remove('sorted'));
    elem.classList.add('sorted');
    const column = Array.from(elem.parentElement.children).indexOf(elem)
    Array.from(table.querySelectorAll('tbody>tr'))
        .sort(getCompareFn(column, descending, type))
        .forEach(tr => table.tBodies[0].appendChild(tr));
}

// returns a function that compares two <tr> elements
function getCompareFn(column, descending, type) {
    return function(tr1, tr2) {
        let v1 = tr1.childNodes[column].innerText
        let v2 = tr2.childNodes[column].innerText
        if (type === "string") {
            return (descending ? v2.localeCompare(v1) : v1.localeCompare(v2));
        } else {
            v1 = myParseNumber(v1);
            v2 = myParseNumber(v2);
            return (descending ? v2 - v1 : v1 - v2);
        }
    };
}

// Like parseInt but calculate "50x8" to 400 instead of just 50
function myParseNumber(str) {
    if (str.includes('x')) {
        return str.split('x').reduce((accumulated, current) => accumulated * parseInt(current), 1);
    } else {
        return parseInt(str);
    }
}

document.addEventListener("DOMContentLoaded", function() {
    document.querySelector("#refresh").addEventListener("click", event => {
        fetchAmmoData();
    });

    document.getElementById('search_input').addEventListener('input', search);
    let data = localStorage.getItem('data');
    if (!data || !data.includes('projectileCount')) {
        fetchAmmoData();
    } else {
        repopulateTable();
    }
    document.querySelectorAll('th').forEach(th => th.addEventListener('click', sort));
});
