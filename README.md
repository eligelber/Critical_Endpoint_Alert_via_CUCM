# Critical Endpoint Alert via CUCM

*ServiceNow* case created and *Webex Teams* message sent upon *CUCM* reported issue with a critical phone or video device


## Business/Technical Challenge

Many customers have Cisco Unified Communications Manager *CUCM* phones and video systems in critical areas like hospital rooms, CXO desks and Continuity Of OPerations *COOP* sites.  These Customers need to know the moment there are issues with CUCM endpoints.  Customers want their support teams to **respond proactively** and **reduce the mean time to repair.**

It is no longer acceptable to wait to take action until after a user reports an issue.  In many situations, critical endpoints demand 99.999% uptime.  In order to maintain this high level of service, Information Technology Teams need to **leverage the power of programmability and automation** to proactively respond to issues with critical phones and video systems. 

Customers will rest easy when they utilize our **Critical Endpoint Alert via *CUCM*** system.    In fact, they may have to change their name from the response team to the advanced response team ;-) 

## Proposed Solution

Our project uses programmability and automation to monitor a Customer's critical phones and video systems.  When a issue with a critical endpoint is detected, a *ServiceNow* ticket will be opened automatically with the highest priority.  The response team will be alerted via a message sent from *ServiceNow* to a *Webex Teams* space. 

The application programming interfaces of  *CUCM* - *ServiceNow* - *Webex Teams* were utilized to create this automated process.

### Cisco and non-Cisco Products Technologies / Services

Our solution leverages the following Cisco and non-Cisco technologies:

* [Cisco Unified Communicatons Manager (CUCM)](https://www.cisco.com/c/en/us/products/unified-communications/unified-communications-manager-callmanager/index.html)
* [Webex Teams](https://www.webex.com/team-collaboration.html)
* [ServiceNow](https://www.servicenow.com/)

## Team Members

* Eli Gelber <egelber@cisco.com> - USPS SLED
* Johan Nemitz <jnemitz@cisco.com> - GES 
* Phil Selker <pselker@cisco.com> - USPS FED DOD

## Solution Components

* node.js
* Botkit framework
* ngrok
* ServiceNow developer instance
* Cisco DevNet 
* CUCM
* Cisco endpoints

## Usage

[![Critical Endpoint Alert](http://img.youtube.com/vi/ufbUg578HX4/0.jpg)](http://www.youtube.com/watch?v=ufbUg578HX4)


## Installation

1. Clone this repo:

    ```sh
    git clone https://github.com/eligelber/Critical_Endpoint_Alert_via_CUCM.git
    ```

1. Install the Node.js dependencies:

    ```sh
    npm install
    ```

1. Create two Webex Teams bot accounts at [Webex for Developers](https://developer.webex.com/my-apps/new/bot). One for interactions with CUCM and ServiceNow. The other to send messages from ServiceNow to Webex Teams.

1. Create a ServiceNow developer instance and load the ServiceNow app.   Instructions are in the [SNOW-WebexTeams-Infrastructure repo](https://github.com/pselker2/SNOW-WebexTeams-Infrastructure)

1. Download and Launch [ngrok](https://botkit.ai/getstarted.html) to expose port 3000 of your local machine to the internet:

    ```sh
    ngrok http 3000
    ```
1. Rename the `dot-env-file` file to `.env`, then edit for the settings of your bot.

1. Run the bot:

    ```sh
    node bot.js
    ```

1. Use the help command in the bot for additional infomation.

## Documentation

* [Botkit](https://botkit.ai/getstarted.html)
* [ngrok](https://botkit.ai/getstarted.html)
* [Create ServiceNow app to host bot](https://github.com/pselker2/SNOW-WebexTeams-Infrastructure)
* [Cisco DevNet](https://developer.cisco.com/)



## License

Provided under Cisco Sample Code License, for details see [LICENSE](./LICENSE.md)

## Code of Conduct

Our code of conduct is available [here](./CODE_OF_CONDUCT.md)

## Contributing

See our contributing guidelines [here](./CONTRIBUTING.md)
