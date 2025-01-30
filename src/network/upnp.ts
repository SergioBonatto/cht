import upnp from 'nat-upnp';
import { publicIpv4 } from 'public-ip';

export const setupUPnP = async (port: number): Promise<void> => {
    const client = upnp.createClient();
    const publicIpAddress = await publicIpv4();
    client.portMapping({
        public: port,
        private: port,
        ttl: 10
    }, (err) => {
        if (err) {
            console.error('UPnP port mapping error:', err);
        } else {
            console.log(`Port ${port} mapped to public IP ${publicIpAddress}`);
        }
    });
};
