import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
const address = require('address');
const got = require('got');

export class Device {
  private macAddress;
  private ip$: Subject<any>;

  constructor() {
    address.mac((err, addr) => {
      if (err) throw console.log('MacAddress has : %s', err);
      this.macAddress = addr;
    });

    this.ip$ = Observable.create(observer => {
      const interval = setInterval(() => {
        observer.next(address.ip());
      }, 1000); // 1 min.

      return () => clearInterval(interval);
    });

    this.ip$.pipe(distinctUntilChanged()).subscribe(ip => {
      this.uploadLocalIp(ip);
    });
  }

  private uploadLocalIp(localIp: any) {
    if (localIp !== undefined || localIp !== null) {
      (async () => {
        try {
          const response = await got.post('http://localhost:5000/tst-application/us-central1/updateIpDevice', {
            // const response = await got.post('https://us-central1-tst-application.cloudfunctions.net/updateIpDevice', {
            query: {
              mac: this.macAddress,
              ip: localIp,
            },
          });
          const data = response.body;
          console.log(data);
          return data;
        } catch (error) {
          console.log('Error :' + error.response.body);
          return 'Error :' + error.response.body;
        }
      })();
      console.log('%s has change ip to %s', this.macAddress, localIp);
    }
  }

  public async fetchSetup(): Promise<any> {
    try {
      const response = await got.get('http://localhost:5000/tst-application/us-central1/getDeviceSetup', {
        // const response = await got.get('https://us-central1-tst-application.cloudfunctions.net/getDeviceSetup', {
        query: {
          mac: this.macAddress,
        },
      });
      if (response.body !== '') {
        const data = JSON.parse(response.body);
        //  { status: string,
        //    client_limit: number,
        //    local_ip: string ,
        //    serial_port:
        //      { port_name: string,
        //        parity: string,
        //        data_bits: number,
        //        baud_rate: number,
        //        stop_bits: number
        //      }
        // }
        return data;
      } else {
        console.log('Not found');
        return null;
      }
    } catch (error) {
      console.log('Error ' + error.response.body);
      return 'Error ' + error.response.body;
    }
  }

  public stop() {
    this.ip$.unsubscribe();
  }
}
