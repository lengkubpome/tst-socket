"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MacAddress {
    getMacAddress() {
        require('getmac').getMac(function (err, macAddress) {
            if (err)
                throw err;
            console.log(macAddress);
        });
    }
    checkMacAddress(isMacAddress) {
        // Validate that an address is a mac address
        if (require('getmac').isMac(isMacAddress)) {
            return true;
        }
        else {
            return false;
        }
    }
}
exports.MacAddress = MacAddress;
