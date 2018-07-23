export class MacAddress {
  public getMacAddress() {
    require('getmac').getMac(function(err, macAddress) {
      if (err) throw err;
      console.log(macAddress);
    });
  }

  public checkMacAddress(isMacAddress: string): boolean {
    // Validate that an address is a mac address
    if (require('getmac').isMac(isMacAddress)) {
      return true;
    } else {
      return false;
    }
  }
}
