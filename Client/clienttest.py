import time
from datetime import datetime
from nmap import nmap
import socketio
from threading import Thread, Event
from noise import pnoise1
import csv
import os


class PFDclient():
    def __init__(self):
        self.read_data: bool = False

        self.filetime = datetime.now().strftime('%m%d%y_%H%M%S')
        self.currentfile = os.getcwd() + '/data/' + self.filetime + '.csv'

        self.fieldnames = ['time', 'depth', 'IMUx', 'IMUy', 'IMUz']

        self.PORT = 3000

        try:
            self.HOST = '127.0.0.1'  #self.find_server_ip()
        except KeyboardInterrupt:
            print('Quitting')

        self.sio: socketio = socketio.Client()
        self.sio.on('connect', self.on_connect)
        self.sio.on('command', self.on_command)
        self.sio.on('reconnect', self.on_reconnect)
        self.sio.on('disconnect', self.on_disconnect)

        self.connect()

    def connect(self):
        try:
            self.sio.connect('http://' + self.HOST + ':' + str(self.PORT))
            self.sio.wait()
        except Exception as e:
            print(e)
            time.sleep(.5)
            self.connect()

        self.connect()

    def on_connect(self):
        print('connection established')

    def on_command(self, command):
        print(type(command), command)
        if command['Command'] == 'Arm':
            self.filetime = datetime.now().strftime('%m%d%y_%H%M%S')
            self.currentfile = os.getcwd() + '/data/' + self.filetime + '.csv'

            with open(self.currentfile, 'w', newline='') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=self.fieldnames)
                writer.writeheader()

            Thread(target=self.sensor_data).start()
            print('Armed')
        elif command['Command'] == 'Disarm':
            self.read_data = False

            with open(self.currentfile, 'rb') as f:
                content = f.read()
                self.sio.emit('file', {'name': self.filetime, 'content': content})

            print('Disarmed')

    def on_reconnect(self):
        print('[Reconnected]')

    def on_disconnect(self):
        print('disconnected from server')

    def sensor_data(self):
        frame = 0
        self.read_data = True
        while self.read_data:
            data = {'time': datetime.now().strftime('%m/%d/%y_%H:%M:%S.%f'),
                    'depth': pnoise1(frame * .0023) * 150,
                    'IMUx': pnoise1(frame * -.0013),
                    'IMUy': pnoise1(frame * -.0073),
                    'IMUz': pnoise1(frame * -.0003)}

            frame += 1
            self.writefile(data)
            self.sio.emit('sensor data', data)
            time.sleep(.1)

    def writefile(self, data):
        with open(self.currentfile, 'a', newline='') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=self.fieldnames)
            writer.writerow(data)

    def find_server_ip(self) -> str:
        """
        creates a port scanner which finds all machines on network and pings their port 3000.  The first machine with an
        open port 3000 (signifying the server) is returned.
        :return: IP_address as str
        """
        import socket
        net = socket.gethostbyname(socket.gethostname())
        net = '.'.join(net.split('.')[:-1])
        net = net + '.0/24'

        while True:
            nm = nmap.PortScanner()

            results = nm.scan(hosts=net, ports=str(self.PORT), arguments='')
            for resultip in results['scan']:
                if results['scan'][resultip]['tcp'][self.PORT]['state'] == 'open':
                    return resultip

            time.sleep(.5)


if __name__ == '__main__':
    pfd = PFDclient()
