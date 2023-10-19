if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js', { scope: '/' }).then(function(reg) {

    if(reg.installing) {
      console.log('Service worker installing');
    } else if(reg.waiting) {
      console.log('Service worker installed');
    } else if(reg.active) {
      console.log('Service worker active');
    }


  }).catch(function(error) {
    // registration failed
    console.log('Registration failed with ' + error);
  });
}


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
        appendTD(ammo.damage);
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

document.addEventListener("DOMContentLoaded", function() {
    document.querySelector("#refresh").addEventListener("click", event => {
        fetchAmmoData();
        repopulateTable();
    });

    document.getElementById('search_input').addEventListener('input', search);
    if (!localStorage.getItem('data')) {
        fetchAmmoData();
    } else {
        repopulateTable();
    }
});
