const base64 = require( 'base-64' );
const xml2js = require( 'xml2js' );
const util = require( 'util');

const https = require('https');
const request = require('request');
const CUCM_ADDRESS = process.env.CUCM_ADDRESS; 
const devInstance = process.env.devInstance;
const table = process.env.table;    
 
// Basic authorization is a CUCM Application user and the password
const auth = 'Basic ' + new Buffer.from(process.env.RIS_USER + ":" + process.env.RIS_PASSWORD).toString("base64");

// Basic authorization for SNOW is admin and password
const snowauth = 'Basic ' + new Buffer.from(process.env.snow_username + ":" + process.env.snow_password).toString("base64");


module.exports = function ( controller ) {

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    var monitorInterval = 10; // seconds

    var monitoredDevices = null;

    // If you want to start with a pre-existing list of devices to monitor...
    var monitoredDevices = [ 
        'SEPAC7E8AB60168',
        'SEP74A02FC102EF'
    ];

    var monitorTimer = null;

    var monitorBotReference = null;

    var lastStateInfo = null;

    const parser = new xml2js.Parser();

    const createSNOWticket = (endpts) => {
    return new Promise((resolve, reject) => {
 
        const devname = endpts[0];
        const dn = endpts[1];
        const dnStatReason = endpts[2];
        var SNOWdescription = "Unknown";  //dnStatReason = 1
        var sPriority = 3; //default priority for ticket
        
        // Resistration Status - description for SNOW ticket

        if (dnStatReason == 2) { 
            SNOWdescription = "Connectivity Error";
        }
                
         if (dnStatReason == 8) { 
            SNOWdescription = "Device Inititated Reset";
        }
                
         if (dnStatReason == 9) { 
            SNOWdescription = "Call Manger Reset: " + '\n' + "A device reset was initiated from CUCM Administration, either due to an explicit command from an administrator, or due to internal errors encountered.  No action necessary; the device will re-register automatically.";
        }
        
         if (dnStatReason == 10) { 
            SNOWdescription = "Device Unregistered";
        }
      
        if (dnStatReason == 12) { 
            SNOWdescription = "SCCP Device Throttling";
        }
  
        if (dnStatReason == 13) { 
            SNOWdescription = "Keep Alive Timeout: " + '\n' + "A KeepAlive message was not received.  Possible causes include device power outage, network power outage, network configuration error, network delay, packet drops, and packet corruption.  It is also possible to receive this error if the Cisco Unified CM node is experiencing high CPU usage.  Verify that the device is powered up and operating, there is network connectivity between the device and CUCM, and the CPU utilization is in the safe range.  Monitor CPU utilization via the CPU Pegging Alert in RTMT.";
            sPriority = 1;
        }
   
         if (dnStatReason == 14) { 
            SNOWdescription = "Configuration Mismatch";
        }

          if (dnStatReason == 15) { 
            SNOWdescription = "Call Manager Restart";
        }
   
         if (dnStatReason == 16) { 
            SNOWdescription = "Duplicate Registration";
        }
   
         if (dnStatReason == 17) { 
            SNOWdescription = "Call Manager Apply Config";
        }
   
         if (dnStatReason == 18) { 
            SNOWdescription = "Device No Response";
        }
   
         if (dnStatReason == 19) { 
            SNOWdescription = "Power Save Plus";
        }
            
        
        const options = { 
            "method": "POST",
            "hostname": devInstance + ".service-now.com",
            "path": "/api/now/table/" + table,
            "headers": {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": snowauth,
                "Cache-Control": "no-cache",
                "Host": devInstance + ".service-now.com"
           }
        };

        //console.log("dnStatReason: " + dnStatReason); //Debug
        //console.log("createSNOWticket options: ");  //Debug
        //console.log(JSON.stringify(options));  //Debug
        
        const req = https.request(options, (res) => {
            console.log('status code: ' + res.statusCode);
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error('statusCode=' + res.statusCode));
            } 
            var body = [];
            res.setEncoding('utf8');
            res.on('data', function(chunk) {
                body.push(chunk);
                //Debug console.log("Got Data: " + body);
            });
            res.on('end', function() {
                try {
                    body = JSON.stringify(body);
                   //Debug console.log("body in try: " + body);
                } catch(e) {
                    reject(e);
                }
                console.log("createSNOWticket: Before resolve endpts");  //Debug
                resolve(endpts);
            });
        });
        req.on('error', (e) => {
          reject(e.message);
        });


        var postData = JSON.stringify({"short_description":"The endpoint with DN = " + dn + " and Device Name = " + devname + " has a critical issue.","description":"CUCM:  " + SNOWdescription + " test ","state":1, "priority":sPriority}); 

        req.write(postData);
        
        
        req.end(function() {
            console.log("createSNOWticket: req.end ");  //Debug
        });
    }).catch((Error) => {
        console.log("createSNOWticket Error: in promise chain:  " + Error);
        });
};

    
    controller.hears( 'risport add', 'message,direct_message', async ( bot, message ) => {

        let command = message.text.split( ' ' );
        monitoredDevices.push( command[ 2 ] );
        await bot.reply( message, `Added device to monitoring list--> \`${ command[ 2 ] }\`` );
        if ( !monitorTimer ) {
            await bot.reply( message, 'Monitoring is currently disabled.  Use `risport start` to enable.' );
        }
    });

    controller.hears( 'risport remove', 'message,direct_message', async ( bot, message ) => {

        let command = message.text.split( ' ' );
        // monitoredDevices.filter() [.filter() is a method for arrays] will keep all values in monitoredDevices that DO NOT equal the value in command[2] which is the device to remove from the list 
        monitoredDevices = monitoredDevices.filter( ( i ) => { return i != command[ 2 ] } );
        await bot.reply( message, `Removed device--> ${ command[ 2 ] }` );
        if ( monitoredDevices.legnth == 0 ) {
            clearInterval( monitorTimer );  // stop monitoring
            await bot.reply( message, 'All devices removed - monitoring disabled' );
        }
    });

    controller.hears( '^risport start', 'message,direct_message', async ( bot, message ) => {

        if ( monitoredDevices.length == 0 ) {
            await bot.reply( 'No devices to monitor.  Use `risport add {devicename}` to add a device' );
            return;
        }

        monitorBotReference = message.reference;
        console.log('In risport start monitorBotReference: ', JSON.parse(JSON.stringify(monitorBotReference))); //debug

        if ( monitorTimer ) {
            await bot.reply( 'Monitoring has already been started' );
            return;
        }

        monitorTimer = setInterval( risportPoll, monitorInterval * 1000 );  //This starts the monitoring in risportPoll function

        await bot.reply( message, `Monitoring enabled - devices will be polled every ${ monitorInterval } seconds` );
    });    
    
    controller.hears( '^risport stop', 'message,direct_message', async ( bot, message ) => {

        if ( monitorTimer ) {
            clearInterval( monitorTimer );  //This stops the monitoring of the devices
            
            // values set to null below incase risport start is used after risport stop
            monitorTimer = null;
            monitorBotReference = null;
            lastStateInfo = null;

        }
        await bot.reply( message, 'Device monitoring stopped' );
    });

    async function risportPoll() {

        let stateInfo; 

        if ( lastStateInfo ) {
            stateInfo = lastStateInfo.replace(/&/g, '&amp;') //replace & globally with &amp;
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');
        }
        else {
            stateInfo = '';
        }

        let xmlReq = `<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" 
            xmlns:soap=\"http://schemas.cisco.com/ast/soap\">
            <soapenv:Header/>
            <soapenv:Body>
                <soap:selectCmDeviceExt>
                    <soap:StateInfo>${ stateInfo }</soap:StateInfo>
                    <soap:CmSelectionCriteria>
                        <soap:MaxReturnedDevices>${ monitoredDevices.length }</soap:MaxReturnedDevices>
                        <soap:DeviceClass>Any</soap:DeviceClass>
                        <soap:Model>255</soap:Model>
                        <soap:Status>Any</soap:Status>
                        <soap:NodeName/>
                        <soap:SelectBy>Name</soap:SelectBy>
                        <soap:SelectItems>\n`;

        for ( device of monitoredDevices ) {
            xmlReq += `                            <soap:item><soap:Item>${ device }</soap:Item></soap:item>\n`
        }

        xmlReq += `                        </soap:SelectItems>
                        <soap:Protocol>Any</soap:Protocol>
                        <soap:DownloadStatus>Any</soap:DownloadStatus>        
                    </soap:CmSelectionCriteria>
                </soap:selectCmDeviceExt>
            </soapenv:Body>
        </soapenv:Envelope>`;

        let thisSnapshot = null;

        await fetch( `https://${ process.env.CUCM_ADDRESS }:8443/realtimeservice2/services/RISService70`,
            {
                method: "POST",
                body: xmlReq,
                headers: { 
                    "Content-Type": "text/xml", 
                    "SOAPAction": "\"selectCmDeviceExt\"",
                    Authorization: 'Basic ' + base64.encode( process.env.RIS_USER + ':' + process.env.RIS_PASSWORD )
                }
        } )
        .then( async res => await res.text() )
        .then( async body => await parser.parseString( body, async ( err, result ) => {
                thisSnapshot = result;
                //console.log('Parsed XML /n' + util.inspect(result, { showHidden: true, depth: null})); //debug to see the entire XML body
            } )
        )
        .catch((Error) => {
        console.log("fetch Error: in xml POST:  " + Error);
        });

        //console.log('thisSnapshot: ', JSON.parse(JSON.stringify(thisSnapshot))); //debug
        lastStateInfo = thisSnapshot['soapenv:Envelope']
            ['soapenv:Body'][0]
                ['ns1:selectCmDeviceResponse'][0]
                    ['ns1:selectCmDeviceReturn'][0]
                        ['ns1:StateInfo'][0];

        //console.log('lastStateInfo: ', JSON.parse(JSON.stringify(lastStateInfo))); //debug
        let nodeList = thisSnapshot['soapenv:Envelope']
            ['soapenv:Body'][0]
                ['ns1:selectCmDeviceResponse'][0]
                    ['ns1:selectCmDeviceReturn'][0]
                        ['ns1:SelectCmDeviceResult'][0]
                            ['ns1:CmNodes'][0]
                                ['ns1:item'];

        let report = '';

        for ( node of nodeList ) {

            deviceList = node['ns1:CmDevices'][0]['ns1:item'];

            // if deviceList is empty, jump out of for (node of nodeList) loop
            // because this is a "continue" statement. Node being empty means the status of the endpoints did not change
            if ( !deviceList ) continue;

            for ( device of deviceList ) {

                // added StatusReason and DirNumber for testing
                let padName = ( device['ns1:Name'][0] + '               ' ).slice( 0, 15 );
                report += '`' + padName + ': ' + device['ns1:Status'][0] + ' DN: ' + device['ns1:DirNumber'][0] + '`  \n';
                // this loop is were I get the <ns1:StatusReason> for the device
                // if device['ns1:Status'][0] == UnRegistered
                //      then open SNOW ticket
                
                if (device['ns1:Status'][0]== "UnRegistered") {
                    // Open SNOW ticket
                    let dNum = device['ns1:DirNumber'][0].split( '-' );
                    var iput = [ padName, dNum[0], device['ns1:StatusReason'][0] ]
                    await createSNOWticket(iput);                
                }
            }
        }

        if ( report == '' ) return;

        // The two lines below are needed to send the report to the channel/space
        // Per botkit docs
        bot = await controller.spawn( );
        await bot.changeContext( monitorBotReference );
        
        await bot.say( { channelData: { markdown: report } } );
    }

    controller.commandHelp.push( { command: 'risport', text: 'Monitor a list of phone devices for registration changes; includes `risport add {devicename}`, `risport remove {deviceName}`, `risport start`, `risport stop`' } );

}