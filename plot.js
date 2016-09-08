'use strict';

class StationRepository {
    getStations() {
        return stationJson.map((station) => {
            return {
                coordinates: {
                    latitude: station.loc.lat,
                    longitude: station.loc.lng
                },
                cityId: station.wcityid,
                id: station.wid,
                name: station.name,
                timezone: station.timezone.local,
                address: {
                    street1: station.address.street1,
                    city: station.address.city,
                    postalCode: station.address.postal,
                    state: station.address.state,
                    country: station.address.country
                }
            };
        });
    }
}

class AddressGpsService {
    constructor() {
        this.service = new google.maps.Geocoder();
    }

    getCoordinates(address) {
        let formattedAddress = `${address.street1}, ${address.city}, ${address.postalCode}, ${address.state}, ${address.country}`;

        return new Promise((resolve, reject) => {
            this.service.geocode({'address': formattedAddress}, (results, status) => {
                if (status !== 'OK') {
                    return reject(status);
                }

                return resolve({
                    latitude: results[0].geometry.location.lat(),
                    longitude: results[0].geometry.location.lng()    
                });
            });
        });
    }
}

class MapFlag {
    constructor(latitude, longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.colorsToIcons = {
            RED: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
            BLUE: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            GREEN: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
        };
    }

    setIconColor(color) {
        this.icon = this.colorsToIcons[color];
    }

    setTitle(title) {
        this.title = title;
    }

    setOnClickContent(content) {
        this.onClickContent = content;
    }
}

class StationMap {
    constructor(elem) {
        var home = {lat: 43.0730556, lng: -89.4011111};
        this.map = new google.maps.Map(elem, {
            zoom: 4,
            center: home
        });
        this.infoWindow = new google.maps.InfoWindow({
            content: 'Loading...'
        });
    }

    addFlag(flag) {
        let marker = new google.maps.Marker({
                position: { 
                    lat: flag.latitude,
                    lng: flag.longitude
                },
                map: this.map,
                title: flag.title,
                icon: flag.icon
            });

        if (!!flag.onClickContent) {
            marker.addListener('click', () => {
				this.infoWindow.setContent(flag.onClickContent);
				this.infoWindow.open(this.map, marker);
			});
        }
    }

}

class StationCheckerApp {
    constructor(elem) {
        this.stationRepository = new StationRepository();
        this.stationMap = new StationMap(elem);
        this.gpsService = new AddressGpsService(); 
    }

    _stationInWrongLocation(assumedCoordinates, actualCoordinates) {
        const threshold = 0.1;
        let latitudeDifference = Math.abs(actualCoordinates.latitude - assumedCoordinates.latitude);
        let longitudeDifference = Math.abs(actualCoordinates.longitude - assumedCoordinates.longitude);

        return latitudeDifference > threshold || longitudeDifference > threshold;
    }

    run() {
        const googleMapsApiRequestDelayInMilliseconds = 1000;
        let stations = this.stationRepository.getStations();
        let stationCheckingFunctions = stations.map((station) => {
            return () => {
                this.gpsService.getCoordinates(station.address)
                    .then((coordinates) => {
                        let flagColor = 'GREEN';
                        
                        if (this._stationInWrongLocation(station.coordinates, coordinates)) {
                            flagColor = 'RED';
                        }

                        let flag = new MapFlag(station.coordinates.latitude, station.coordinates.longitude);
                        flag.setIconColor(flagColor);
                        flag.setTitle(station.name);
                        flag.setOnClickContent(`
                            <ul>
								<li><strong>wcityid:</strong> ${station.cityId}</li>
								<li><strong>wid:</strong> ${station.id}</li>
								<li><strong>address:</strong> ${station.address}</li>
								<li><strong>timezone:</strong> ${station.timezone}</li>
                            </ul>`);

                        this.stationMap.addFlag(flag);
                    }).catch((ex) => {
                        console.log(ex);  
                    });
            };
        });

        setInterval(() => {
            let fn = stationCheckingFunctions.shift();
            if (fn) {
                fn();
            }
        }, googleMapsApiRequestDelayInMilliseconds);
    }
}

function initMap() {
    let map = document.getElementById('map');
    let stationCheckerApp = new StationCheckerApp(map);
    stationCheckerApp.run();
}


let stationJson = [{"loc":{"lng":-71.129814,"lat":44.054382},"wcityid":"NCW","wid":"NCWESI","name":"Eastern Slop Inn - 2760 Main St Rt 302","codes":[{"name":"AMT","value":"NCW"},{"name":"CCC","value":"1363"}],"address":{"city":"North Conway","country":"US","postal":"03860","state":"NH","street1":"2760 Main St, Route 302"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-114.6047964,"lat":34.8399479},"wcityid":"NDL","wid":"NDLAMT","name":"900 Front St","codes":[{"name":"AMT","value":"NDL"}],"address":{"city":"Needles","country":"US","postal":"92363","state":"CA","street1":"900 Front Street"},"country":"US","timezone":{"local":"America/Los_Angeles"}},{"loc":{"lng":-73.111841,"lat":42.698913},"wcityid":"NDM","wid":"NDMPPL","name":"70 N Main St","codes":[{"name":"PPL","value":"040282"},{"name":"TDS","value":"040282"}],"address":{"city":"North Adams","country":"US","postal":"01247","state":"MA","street1":"70 N Main St"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-97.3447286,"lat":38.0470543},"wcityid":"NEW","wid":"NEWAMT","name":"414 N Main St","codes":[{"name":"AMT","value":"NEW"}],"address":{"city":"Newton","country":"US","postal":"67114","state":"KS","street1":"414 North Main Street"},"country":"US","timezone":{"local":"America/Chicago"}},{"loc":{"lng":-76.276336,"lat":36.844172},"wcityid":"NFK","wid":"NFKAMT","name":"280 Park Ave, Harbor Park, lot D","codes":[{"name":"AMT","value":"NFK"}],"address":{"city":"Norfolk","country":"US","postal":"23510","state":"VA","street1":"280 Park Avenue, Harbor Park, lot D"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-76.287996,"lat":36.854551},"wcityid":"NFK","wid":"NFKGLI","name":"Greyhound Station - 701 Monticello Ave","codes":[{"name":"GLI","value":"330847"},{"name":"TDS","value":"330847"}],"address":{"city":"Norfolk","country":"US","postal":"23510","state":"VA","street1":"701 Monticello Ave"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-76.210992,"lat":36.848574},"wcityid":"NFK","wid":"NFKSPT","name":"410 Briar Hill Suite 101","codes":[{"description":"Best Square shopping center","name":"SPT","value":"Norfolk"},{"description":"Best Square shopping center","name":"SWT","value":"Norfolk"}],"address":{"city":"Norfolk","country":"US","postal":"23502","state":"VA","street1":"410 Briar Hill Suite 101"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-79.062409,"lat":43.085476},"wcityid":"NFL","wid":"NFLADT","name":"240 1st St","codes":[{"name":"ADT","value":"151250"}],"address":{"city":"Niagara Falls","country":"US","postal":"14303","state":"NY","street1":"240 1st St"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-79.052143,"lat":43.093575},"wcityid":"NFL","wid":"NFLAMT","name":"27th St and Lockport Road","codes":[{"name":"AMT","value":"NFL"}],"address":{"city":"Niagara Falls","country":"US","postal":"14305","state":"NY","street1":"27th street Lockport Road"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-110.9404,"lat":31.337057},"wcityid":"NGL","wid":"NGLTUF","name":"219 N Arroya Blvd","codes":[{"name":"TUF","value":"NAZ"}],"address":{"city":"Nogales","country":"US","postal":"85621","state":"AZ","street1":"219 N Arroyo Blvd"},"country":"US","timezone":{"local":"America/Phoenix"}},{"loc":{"lng":-118.527338,"lat":34.379451},"wcityid":"NHL","wid":"NHLAMT","name":"Metrolink Station - 24300 Railroad Ave","codes":[{"name":"AMT","value":"NHL"}],"address":{"city":"Santa Clarita","country":"US","postal":"91321","state":"CA","street1":"24300 Railroad Avenue  Metrolink Station"},"country":"US","timezone":{"local":"America/Los_Angeles"}},{"loc":{"lng":-71.638641,"lat":43.616196},"wcityid":"NHN","wid":"NHNTFS","name":"Tedeschi - 325 US Rt 104","codes":[{"name":"CCC","value":"1362"}],"address":{"city":"New Hampton","country":"US","postal":"03256","state":"NH","street1":"325 US Route 104"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-72.925806,"lat":41.299012},"wcityid":"NHV","wid":"NHVUST","name":"Union Station","codes":[{"name":"AMT","value":"NHV"},{"name":"GLI","value":"060115"},{"name":"MEG","value":"New Haven, CT , Union Station"},{"name":"PPL","value":"060115"},{"name":"PPP","value":"060115"},{"name":"TDS","value":"060115"}],"address":{"city":"New Haven","country":"US","postal":"06519","state":"CT","street1":"50 Union Avenue"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-91.823809,"lat":30.008415},"wcityid":"NIB","wid":"NIBAMT","name":"402 W Washington St","codes":[{"name":"AMT","value":"NIB"}],"address":{"city":"New Iberia","country":"US","postal":"70560","state":"LA","street1":"402 West Washington Street - At Railroad Tracks - Downtown"},"country":"US","timezone":{"local":"America/Chicago"}},{"loc":{"lng":-72.093334,"lat":41.354379},"wcityid":"NLC","wid":"NLCAMT","name":"27 Water St","codes":[{"name":"AMT","value":"NLC"}],"address":{"city":"New London","country":"US","postal":"06320","state":"CT","street1":"27 Water Street"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-72.0949053,"lat":41.3568763},"wcityid":"NLC","wid":"NLCWSI","name":"Wheaton Solutions Inc - 45 Water St","codes":[{"name":"GLI","value":"060126"},{"name":"PPP","value":"060126"},{"name":"TDS","value":"060126"}],"address":{"city":"New London","country":"US","postal":"06320","state":"CT","street1":"45 Water St"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-71.378944,"lat":42.918591},"wcityid":"NLD","wid":"NLDNTC","name":"N Londonderry Transp Ctr - 4 Symmes Dr","codes":[{"name":"CCC","value":"1358"}],"address":{"city":"Londonderry","country":"US","postal":"03053","state":"NH","street1":"4 Symmes Drive"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-97.3960305,"lat":42.032495},"wcityid":"NLK","wid":"NLKARX","name":"720 E Norfolk Ave","codes":[{"name":"ARX","value":"580350"},{"name":"TDS","value":"580350"}],"address":{"city":"Norfolk","country":"US","postal":"68701","state":"NE","street1":"720 E Norfolk Ave"},"country":"US","timezone":{"local":"America/Chicago"}},{"loc":{"lng":-86.2523386,"lat":41.837307},"wcityid":"NLS","wid":"NLSAMT","name":"598 Dey St","codes":[{"name":"AMT","value":"NLS"}],"address":{"city":"Niles","country":"US","postal":"49120","state":"MI","street1":"598 Dey Street"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-90.078673,"lat":29.946178},"wcityid":"NOL","wid":"NOLAMT","name":"Union Term - 1001 Loyola Ave","codes":[{"name":"AMT","value":"NOL"},{"name":"GLI","value":"660583"},{"name":"MEG","value":"New Orleans, LA , Union Passenger Terminal (UPT), 1001 Loyola Ave"},{"name":"TDS","value":"660583"}],"address":{"city":"New Orleans","country":"US","postal":"70114","state":"LA","street1":"1001 Loyola Ave"},"country":"US","timezone":{"local":"America/Chicago"}},{"loc":{"lng":-79.998002,"lat":32.874866},"wcityid":"NON","wid":"NONAMT","name":"4565 Gaynor Avenue","codes":[{"name":"AMT","value":"CHS"}],"address":{"city":"North Charleston","country":"US","postal":"29405","state":"SC","street1":"4565 Gaynor Avenue"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-97.443013,"lat":35.219963},"wcityid":"NOR","wid":"NORAMT","name":"200 S Jones Ave","codes":[{"name":"AMT","value":"NOR"}],"address":{"city":"Norman","country":"US","postal":"73069","state":"OK","street1":"200 South Jones Avenue"},"country":"US","timezone":{"local":"America/Chicago"}},{"loc":{"lng":-122.280022,"lat":38.297617},"wcityid":"NPA","wid":"NPAAMT","name":"Soscol Gateway Transit Ctr - 625 Burnell St","codes":[{"name":"AMT","value":"NAP"}],"address":{"city":"Napa","country":"US","postal":"94559","state":"CA","street1":"625 Burnell Street  Soscol Gateway Transit Center"},"country":"US","timezone":{"local":"America/Los_Angeles"}},{"loc":{"lng":-81.481735,"lat":40.491814},"wcityid":"NPH","wid":"NPHBSB","name":"Eagle Truck Stop - 217 County Hwy 21","codes":[{"name":"BSB","value":"250426"},{"name":"TDS","value":"250426"}],"address":{"city":"New Philadelphia","country":"US","postal":"44663","state":"OH","street1":"217 County Hwy 21"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-84.104492,"lat":41.417334},"wcityid":"NPL","wid":"NPLBSB","name":"Petro Gas - 900 American Rd","codes":[{"name":"BSB","value":"250393"},{"name":"TDS","value":"250393"}],"address":{"city":"Napoleon","country":"US","postal":"43512","state":"OH","street1":"900 American Rd"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-76.453018,"lat":37.022175},"wcityid":"NPN","wid":"NPNAMT","name":"9304 Warwick Blvd","codes":[{"name":"AMT","value":"NPN"}],"address":{"city":"Newport News","country":"US","postal":"23601","state":"VA","street1":"9304 Warwick Boulevard"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-76.516874,"lat":37.126565},"wcityid":"NPN","wid":"NPNSPT","name":"551 Bland Blvd","codes":[{"description":"Jefferson Commons shopping center, KOHL's parking lot","name":"SPT","value":"Newport News"},{"description":"Jefferson Commons shopping center, KOHL's parking lot","name":"SWT","value":"Newport News"}],"address":{"city":"Newport News","country":"US","postal":"23602","state":"VA","street1":"551 Bland Blvd"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-124.060478,"lat":44.627396},"wcityid":"NPO","wid":"NPOAMT","name":"Valley Retriever Station - 956 SW 10th St","codes":[{"name":"AMT","value":"NPO"}],"address":{"city":"Newport","country":"US","postal":"97365","state":"OR","street1":"956 SW 10th Street  Valley Retriever Station"},"country":"US","timezone":{"local":"America/Los_Angeles"}},{"loc":{"lng":-86.0157687,"lat":41.4433269},"wcityid":"NPP","wid":"NPPBSB","name":"1054 W Market St","codes":[{"name":"BSB","value":"262152"},{"name":"TDS","value":"262152"}],"address":{"city":"Nappanee","country":"US","postal":"46550","state":"IN","street1":"1054 W Market St"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-85.8469875,"lat":41.4490402},"wcityid":"NPR","wid":"NPRBSB","name":"72025 Indiana Rt 15","codes":[{"name":"BSB","value":"260087"},{"name":"TDS","value":"260087"}],"address":{"city":"New Paris","country":"US","postal":"46553","state":"IN","street1":"72025 Indiana Rt 15"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-88.145497,"lat":41.779514},"wcityid":"NPV","wid":"NPVAMT","name":"105 E Fourth Ave","codes":[{"name":"AMT","value":"NPV"},{"name":"BTW","value":"563981"},{"name":"TDS","value":"563981"}],"address":{"city":"Naperville","country":"US","postal":"60540","state":"IL","street1":"105 E. Fourth Ave.  Corner of 4th Avenue & Ellsworth Street"},"country":"US","timezone":{"local":"America/Chicago"}},{"loc":{"lng":-74.080498,"lat":41.738912},"wcityid":"NPZ","wid":"NPZADT","name":"SUNY New Paltz - Lot 28 Rte 32","codes":[{"name":"ADT","value":"150217"},{"name":"TDS","value":"150217"}],"address":{"city":"New Paltz","country":"US","postal":"12561","state":"NY","street1":"Lot 28, Route 32"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-74.0822316,"lat":41.7475628},"wcityid":"NPZ","wid":"NPZTNY","name":"Trailways Bus Term - 139 Main St","codes":[{"description":"Additional pick up at Exit 18, Park & Ride","name":"ADT","value":"151217"},{"name":"TDS","value":"151217"}],"address":{"city":"New Paltz","country":"US","postal":"12561","state":"NY","street1":"139 Main St."},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-73.784329,"lat":40.911451},"wcityid":"NRC","wid":"NRCAMT","name":"Metro-North Station - 1 Railroad Plz","codes":[{"name":"AMT","value":"NRO"}],"address":{"city":"New Rochelle","country":"US","postal":"10801","state":"NY","street1":"1 Railroad Plaza  Metro-North Station"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-73.778068,"lat":40.91104},"wcityid":"NRC","wid":"NRCTNY","name":"404 Main St","codes":[{"description":"Main Street Super Market","name":"ADT","value":"151228"},{"name":"TDS","value":"151228"}],"address":{"city":"New Rochelle","country":"US","postal":"10801","state":"NY","street1":"404 Main St."},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-75.753513,"lat":39.669686},"wcityid":"NRK","wid":"NRKAMT","name":"429 S College Ave","codes":[{"name":"AMT","value":"NRK"}],"address":{"city":"Newark","country":"US","postal":"19711","state":"DE","street1":"429 South College Avenue"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-75.750022,"lat":39.683629},"wcityid":"NRK","wid":"NRKMEG","name":"Parking Lot #6 on Christiana Dr","codes":[{"name":"MEG","value":"Newark, DE , U of Delaware - Parking Lot #6 on Christiana Dr"}],"address":{"city":"Newark","country":"US","postal":"19711","state":"DE","street1":"University of Delawares Parking Lot #6 on Christiana Dr."},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-84.1836809,"lat":33.9343558},"wcityid":"NSG","wid":"NSGGLI","name":"Greyhound Station - 2105 Norcross Pkwy","codes":[{"name":"SES","value":"410784"},{"name":"TDS","value":"410784"}],"address":{"city":"Norcross","country":"US","postal":"30071","state":"GA","street1":"2105 Norcross Pkwy"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-71.501449,"lat":42.793447},"wcityid":"NSH","wid":"NSHPPL","name":"Transp Ctr - 8 N Southwood Dr","codes":[{"name":"AMT","value":"NSH"},{"name":"PPL","value":"020152"},{"name":"TDS","value":"020152"}],"address":{"city":"Nashua","country":"US","postal":"03064","state":"NH","street1":"8 North Southwood Drive"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-72.627534,"lat":42.3179469},"wcityid":"NTH","wid":"NTHAMT","name":"170 Pleasant St","codes":[{"name":"AMT","value":"NHT"}],"address":{"city":"Northampton","country":"US","postal":"01060","state":"MA","street1":"170 Pleasant Street"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-72.632159,"lat":42.316727},"wcityid":"NTH","wid":"NTHPPL","name":"Peter Pan Term - 1 Roundhouse Plz","codes":[{"name":"PPL","value":"040293"},{"name":"TDS","value":"040293"}],"address":{"city":"Northampton","country":"US","postal":"01060","state":"MA","street1":"1 Roundhouse Plaza"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-100.7642904,"lat":41.1163678},"wcityid":"NTT","wid":"NTTBTW","name":"1801 S Jeffers St","codes":[{"name":"ARX","value":"580371"},{"name":"BTW","value":"580371"},{"name":"TDS","value":"580371"}],"address":{"city":"North Platte","country":"US","postal":"69101","state":"NE","street1":"1801 S Jeffers Street"},"country":"US","timezone":{"local":"America/Chicago"}},{"loc":{"lng":-72.783247,"lat":41.667416},"wcityid":"NWB","wid":"NWBPPL","name":"64 W Main St","codes":[{"name":"PPL","value":"060104"},{"name":"TDS","value":"060104"}],"address":{"city":"New Britain","country":"US","postal":"06051","state":"CT","street1":"64 W Main St"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-74.19062,"lat":40.704384},"wcityid":"NWK","wid":"NWKAIR","name":"Newark Intl Airport","codes":[{"name":"AMT","value":"EWR"}],"address":{"city":"Newark","country":"US","postal":"07114","state":"NJ","street1":"Newark Liberty International Airport"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-74.164732,"lat":40.733893},"wcityid":"NWK","wid":"NWKPNS","name":"Penn Station","codes":[{"name":"AMT","value":"NWK"},{"name":"BLT","value":"Newark, NJ (Newark Penn Station)"},{"name":"GLI","value":"160182"},{"name":"PPL","value":"160182"},{"name":"PPP","value":"160182"},{"name":"TDS","value":"160182"}],"address":{"city":"Newark","country":"US","postal":"07102","state":"NJ","street1":"1 Raymond Plaza West,Market Street"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-71.317536,"lat":41.490961},"wcityid":"NWP","wid":"NWPPPL","name":"Gateway Center - 23 America's Cup Ave","codes":[{"name":"MEG","value":"Newport, RI , Newport Visitors Center - 23 Americas Cup Avenue"},{"name":"PPL","value":"050017"},{"name":"TDS","value":"050017"}],"address":{"city":"Newport","country":"US","postal":"02840","state":"RI","street1":"23 America's Cup Avenue"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-71.252598,"lat":42.337375},"wcityid":"NWT","wid":"NWTRBS","name":"Riverside Bus Station - 335 Grove St","codes":[{"name":"GOB","value":"3"},{"name":"MEG","value":"Newton, MA , Riverside Train Terminal at Grove Street"}],"address":{"city":"Newton","country":"US","postal":"02462","state":"MA","street1":"335 Grove St"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-73.990839,"lat":40.750411},"wcityid":"NYC","wid":"NYCBLT1","name":"W 33rd St and 7th Ave","codes":[{"name":"BLT","value":"New York 33rd and 7th by Sbarro's (To DC or Balt.)"}],"address":{"city":"New York","country":"US","postal":"10120","state":"NY","street1":"425 7th Ave"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-73.993714,"lat":40.752508},"wcityid":"NYC","wid":"NYCBLT2","name":"W 34th St and 8th Ave","codes":[{"name":"BLT","value":"New York 34th and 8th by Tick Tock (Phil. or Bos.)"}],"address":{"city":"New York","country":"US","postal":"10001","state":"NY","street1":"W 34th and 8th Ave"},"country":"US","timezone":{"local":"America/New_York"}},{"loc":{"lng":-74.005381,"lat":40.723385},"wcityid":"NYC","wid":"NYCBLT3","name":"6th Ave btwn Grand and Watts","codes":[{"name":"BLT","value":"New York 6th Ave Between Grand & Watts (DC or Phl)"}],"address":{"city":"New York","country":"US","postal":"10014","state":"NY","street1":"101 Avenue of the Americas"},"country":"US","timezone":{"local":"America/New_York"}}];