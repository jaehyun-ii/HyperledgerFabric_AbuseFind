/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('./CAUtil.js');
const { buildCCPOrg, buildWallet } = require('./AppUtil.js');

const RED = '\x1b[31m\n';
const GREEN = '\x1b[32m\n';
const RESET = '\x1b[0m';

function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}

function format() {
	var args = Array.prototype.slice.call (arguments, 1);
	return arguments[0].replace (/\{(\d+)\}/g, function (match, index) {
	   return args[index];
	});
}

async function initUserForOrg(OrgNum, UserId) {
	console.log(`${GREEN}--> Fabric client user & Gateway init: Using identity to Peer${RESET}`);
	// build an in memory object with the network configuration (also known as a connection profile)
	const ccpOrg = buildCCPOrg(OrgNum);

	// build an instance of the fabric ca services client based on
	// the information in the network configuration
	const caOrgClient = buildCAClient(FabricCAServices, ccpOrg, format('ca.org{0}.112.162.20.200',OrgNum));

	// setup the wallet to cache the credentials of the application user, on the app server locally
	const walletPathOrg = path.join(__dirname, 'wallet', format('org{0}',OrgNum));
	const walletOrg = await buildWallet(Wallets, walletPathOrg);
	const orgMSP = format('Org{0}MSP',OrgNum);
	// in a real application this would be done on an administrative flow, and only once
	// stores admin identity in local wallet, if needed
	await enrollAdmin(caOrgClient, walletOrg, orgMSP);
	// register & enroll application user with CA, which is used as client identify to make chaincode calls
	// and stores app user identity in local wallet
	// In a real application this would be done only when a new user was required to be added
	// and would be part of an administrative flow
	await registerAndEnrollUser(caOrgClient, walletOrg, orgMSP, UserId, format('org{0}.department1',OrgNum));

}

async function initGatewayForOrg(OrgNum, UserId) {
	const ccpOrg = buildCCPOrg(OrgNum);
	const walletPathOrg = path.join(__dirname, 'wallet', format('org{0}',OrgNum));
	const walletOrg = await buildWallet(Wallets, walletPathOrg);
	try {
		// Create a new gateway for connecting to Org's peer node.
		const gatewayOrg = new Gateway();
		//connect using Discovery enabled
		await gatewayOrg.connect(ccpOrg,
			{ wallet: walletOrg, identity: UserId, discovery: { enabled: true, asLocalhost: true } });

		return gatewayOrg;
	} catch (error) {
		console.error(`Error in connecting to gateway for Org: ${error}`);
		process.exit(1);
	}
}


async function send(channelName, chaincodeName, orgNum, UserId, type, func, args, res) {
	try {
			/** ******* Fabric client init: Using Org identity to Org Peer ******* */
			const gatewayOrg = await initGatewayForOrg(orgNum, UserId);
			const networkOrg = await gatewayOrg.getNetwork(channelName);
			const contractOrg = networkOrg.getContract(chaincodeName);            
			try {
				if(type == true) { // type true : submit transaction, not only query
					let result = await contractOrg.submitTransaction(func, ...args);
					const resultJSONString = result.toString();
					res.send(resultJSONString);
					console.log('Submit transaction success');
				} else {
					const result = await contractOrg.evaluateTransaction(func, ...args);
					console.log('Evaluate transaction success');
					const resultJSONString = prettyJSONString(result.toString());
					console.log(`*** Result: ${resultJSONString}`);
					const resultString = result.toString();
					console.log(`*** Result: ${resultString}`);
					res.send(resultJSONString);
				}
			}
			finally {
			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			gatewayOrg.disconnect();
			}
		} catch (error) {
			console.error(`${error}`);
			res.send(`${error}`)
		}
}

module.exports = {
    send:send,
	initUserForOrg:initUserForOrg,
}