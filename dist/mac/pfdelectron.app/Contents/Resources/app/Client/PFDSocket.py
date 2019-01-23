import atexit
import json
import socket
import time
from threading import Thread, Event
from nmap import nmap


class PFDSocket:

    def __init__(self):
        """
            This Constructor initializes a blank socket connection and a sending connection which will later be set
            equal to the main socket connection.
            The Host is the IP address corresponding to the current machine
            The Port for the socket connection is set as a constant to 3000
            The is_server and is_client variables are set to false by default until either the server or client function
            is called
            The has connection event is set once a positive connection has been made between the PFD and Server
            The running command is set and is used to close the running Threads efficiently
            The at exit function makes sure running threads are shut down before exit of the application
            The threads are initially set blanks
        """

        self.sock: socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sendConn: socket = socket.socket()
        self.HOST: str = socket.gethostbyname(socket.gethostname())
        self.PORT: int = 3000
        self.is_server: bool = False
        self.is_client: bool = False

        self.has_connection: Event = Event()
        self.has_connection.clear()
        self.running: Event = Event()
        self.running.set()

        self.on_dict: dict = {}

        atexit.register(self.close)

        self.server_thread: Thread = Thread()
        self.client_thread: Thread = Thread()
        self.listen_thread: Thread = Thread()

    def server(self):
        """
            This function is called to set the PFD class into server mode.  It binds the server thread to the current IP
            and Port
            The _server function is then called in a seperate thread
        """

        self.is_server = True
        print('Starting up Server on ' + self.HOST + ':' + str(self.PORT))
        temp = False
        while not temp:
            try:
                self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                self.sock.bind((self.HOST, self.PORT))
                temp = True
            except Exception as e:
                pass

        self.server_thread = Thread(target=self._server, name="Server")
        self.server_thread.start()

    def _server(self):
        """
        The function will continue waiting for a connection on the Port until a connection is made at which point a
        connection signal will be sent verifying the PFD.  Once positive identification of the PFD has been made the
        more permanent listen function will be called in a seperate thread to listen for incoming signals from the PFD.
        """
        while self.running.is_set():
            if not self.has_connection.is_set():
                print('Waiting for connection from PFD')
                self.sock.listen(1)
                conn, addr = self.sock.accept()

                try:
                    conn.recv(1024)
                    self.has_connection.set()
                    self.sendConn = conn
                    print('Connection from PFD at ' + addr[0] + ':' + str(addr[1]))

                    self.listen_thread = Thread(target=self.listen, args=(conn,))
                    self.listen_thread.daemon = False
                    self.listen_thread.start()
                except ConnectionResetError:
                    pass

    def client(self):
        """
        This function is called to set the PFD in Client mode for the PFD.  The host IP address of the server is found
        on the network by the find_server_ip function.  Once the IP of the server has been returned the _client function
        is called in a seperate thread.
        """
        self.is_client = True
        self.host = self.find_server_ip()
        self.client_thread = Thread(target=self._client, name="Client")
        self.client_thread.start()

    def _client(self):
        """
        This function will continually try connecting to the IP address of the server.  Once positive connection has
        been made a connect signal will be sent to verify positive connection to the server.  Once a positive connection
        is made the permininet listen function is called for incoming signals.
        """
        while self.running.is_set():
            if not self.has_connection.is_set():
                try:
                    print('Waiting for Connection to Server')
                    self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    self.sock.connect((self.HOST, self.PORT))
                    self.sendConn = self.sock

                    conn_msg = 'PFD'
                    self.sendmsg('connect', json.dumps(conn_msg))
                    self.has_connection.set()
                    print('Connected to Server at ' + self.HOST + ':' + str(self.PORT))

                    self.listen_thread = Thread(target=self.listen, args=(self.sock,))
                    self.listen_thread.daemon = False
                    self.listen_thread.start()
                except ConnectionRefusedError:
                    pass
                except Exception as e:
                    pass

            time.sleep(.5)

    def listen(self, conn: socket.socket):
        """
        Continually listens to signals from the connection; if the signal shows disconnection the loop will complete
        closing the thread and returning to the search of either client or server.  If a signal is received the callback
        function is called.
        :param conn: socket to listen on
        """
        while self.has_connection.is_set() and self.running.is_set():
            try:
                data = conn.recv(1024)
            except ConnectionResetError:
                self.has_connection.clear()
                break
            except OSError:
                self.has_connection.clear()
                break

            if not data:
                # Disconnection
                if self.is_server:
                    print("Lost Connection from PFD")
                if self.is_client:
                    print("Lost Connection to Server")

                self.has_connection.clear()
                break

            self.callback(data.decode('utf8'))

    def sendmsg(self, event: str, msg: str):
        """
        Creates a thread from the _sendmsg function.
        :param msg: message to send
        """
        send_thread = Thread(target=self._sendmsg, args=(event, msg), name='Message Send')
        send_thread.daemon = True
        send_thread.start()

    def _sendmsg(self, event: str, msg: str):
        """
        Trys sending the message through the connection
        :param msg: message to send
        """

        try:
            j = json.dumps({event: json.loads(msg)})
        except Exception:
            j = json.dumps({event: msg})

        try:
            self.sendConn.send(j.encode('utf8'), )
        except socket.error:
            self.has_connection.clear()

    def on(self, command, callback):
        """
        Adds the callback function to the on_dict dictionary with command as its key.
        :param command: key to call function
        :param callback: function to be called
        """
        self.on_dict[command] = callback

    def callback(self, data: str):
        """
        Loads data from signal and takes each key to compare to the on_dict to find the corresponding callback
        function to run.
        :param data: String to be compared to for callback
        """

        j = json.loads(data)
        keys = list(j.keys())
        for key in keys:
            info = j[key]

            if key in self.on_dict.keys():
                try:
                    self.on_dict[key](info)
                except Exception as e:
                    pass

    def find_server_ip(self) -> str:
        """
        creates a port scanner which finds all machines on network and pings their port 3000.  The first machine with an
        open port 3000 (signifying the server) is returned.
        :return: IP_address as str
        """
        while True:
            nm = nmap.PortScanner()
            ip = self.HOST
            ip = '.'.join(ip.split('.')[:-1])
            ip = ip + '.0/24'
            results = nm.scan(hosts=ip, ports=str(self.PORT), arguments='')
            for ip in results['scan']:
                if results['scan'][ip]['tcp'][self.PORT]['state'] == 'open':
                    return ip

            time.sleep(.5)

    def close(self):
        """
        For closing the threads correctly.  Clears the running flag and closes the socket connection, then joins any of
        the alive threads to the main thread and waits for the threads to die.
        """

        print('Quitting', self.listen_thread.is_alive(), self.server_thread.is_alive(), self.client_thread.is_alive())

        self.running.clear()
        self.sock.close()

        if self.listen_thread.is_alive():
            self.listen_thread.join(1)
        if self.server_thread.is_alive():
            self.server_thread.join(1)
        if self.client_thread.is_alive():
            self.client_thread.join(1)

        while self.server_thread.is_alive() or self.client_thread.is_alive() or self.listen_thread.is_alive():
            pass

        exit(0)